terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
  # backend "s3" {
  #   # Configured per environment in envs/dev/backend.tf and envs/prod/backend.tf
  # }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "cold-storage-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ─── Networking ───────────────────────────────────────────────────────────
module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
  aws_region  = var.aws_region
}

# ─── Database (Aurora PostgreSQL + TimescaleDB) ─────────────────────────
module "rds" {
  source              = "../../modules/rds"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id
  db_instance_class   = var.db_instance_class
  db_name             = "cold_storage"
  db_username_secret_arn = module.secrets.db_credentials_arn
}

# ─── ElastiCache Redis ────────────────────────────────────────────────────
module "elasticache" {
  source             = "../../modules/elasticache"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
}

# ─── ECS Fargate (Backend + Celery) ─────────────────────────────────────
module "ecs" {
  source               = "../../modules/ecs"
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  private_subnet_ids   = module.vpc.private_subnet_ids
  ecr_image_uri        = var.backend_ecr_image_uri
  careers_ecr_image_uri = var.careers_ecr_image_uri
  db_secret_arn        = module.secrets.db_credentials_arn
  app_secrets_arn      = module.secrets.app_secrets_arn
  rds_endpoint         = module.rds.endpoint
  redis_endpoint       = module.elasticache.endpoint
  alb_security_group_id = module.vpc.alb_security_group_id
  ecs_security_group_id = module.vpc.ecs_security_group_id
}

# ─── AWS IoT Core ─────────────────────────────────────────────────────────
module "iot_core" {
  source      = "../../modules/iot-core"
  environment = var.environment
}

# ─── S3 Buckets ───────────────────────────────────────────────────────────
module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
  aws_region  = var.aws_region
  cloudfront_distribution_arns = [
    module.cloudfront.cloudfront_arn,
    "arn:aws:cloudfront::288834682310:distribution/E3OLWZ1I7XXQH7"
  ]
}

# ─── Secrets Manager ──────────────────────────────────────────────────────
module "secrets" {
  source      = "../../modules/secrets"
  environment = var.environment
}

# ─── CloudFront (HTTPS) ───────────────────────────────────────────────────
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

module "cloudfront" {
  source                = "../../modules/cloudfront"
  environment           = var.environment
  s3_bucket_id          = module.s3.web_bucket_id
  s3_bucket_domain_name = module.s3.web_bucket_domain_name
  alb_dns_name          = module.ecs.alb_dns_name
  providers = {
    aws = aws.us_east_1
  }
}

output "cloudfront_domain_name" {
  value = module.cloudfront.cloudfront_domain_name
}

output "certificate_validation" {
  value = module.cloudfront.certificate_validation_options
}

