variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "node_type" { type = string }

resource "aws_elasticache_subnet_group" "main" {
  name       = "cold-storage-redis-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "redis" {
  name   = "cold-storage-redis-${var.environment}"
  vpc_id = var.vpc_id
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "cold-storage-${var.environment}"
  description                = "Cold Storage Redis (Celery broker + cache)"
  node_type                  = var.node_type
  port                       = 6379
  num_cache_clusters         = var.environment == "prod" ? 2 : 1
  automatic_failover_enabled = var.environment == "prod"
  multi_az_enabled           = var.environment == "prod"
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

output "endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}
