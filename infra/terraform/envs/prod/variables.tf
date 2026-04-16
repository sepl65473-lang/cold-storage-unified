variable "environment" {
  description = "Deployment environment (dev / prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region (us-east-1 or eu-west-1)"
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "Aurora PostgreSQL instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.small"
}

variable "backend_ecr_image_uri" {
  description = "ECR image URI for backend Fargate task"
  type        = string
}

variable "careers_ecr_image_uri" {
  description = "ECR image URI for careers Fargate task"
  type        = string
}
