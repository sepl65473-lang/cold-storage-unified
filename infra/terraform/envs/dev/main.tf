terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
  backend "s3" {
    # Example — fill in real bucket/key/region:
    # bucket = "my-terraform-state-dev"
    # key    = "cold-storage/dev/terraform.tfstate"
    # region = "us-east-1"
  }
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

module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
  aws_region  = var.aws_region
}

module "rds" {
  source               = "../../modules/rds"
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id
  db_instance_class    = var.db_instance_class  # smaller for dev
  db_name              = "cold_storage_dev"
  db_username_secret_arn = module.secrets.db_credentials_arn
}

module "elasticache" {
  source             = "../../modules/elasticache"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
}

module "ecs" {
  source             = "../../modules/ecs"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  ecr_image_uri      = var.backend_ecr_image_uri
  db_secret_arn      = module.secrets.db_credentials_arn
  app_secrets_arn    = module.secrets.app_secrets_arn
  rds_endpoint       = module.rds.endpoint
  redis_endpoint     = module.elasticache.endpoint
}

module "iot_core" {
  source      = "../../modules/iot-core"
  environment = var.environment
}

module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
  aws_region  = var.aws_region
}

module "secrets" {
  source      = "../../modules/secrets"
  environment = var.environment
}
