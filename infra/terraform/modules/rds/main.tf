variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_security_group_id" { type = string }
variable "db_instance_class" { type = string }
variable "db_name" { type = string }
variable "db_username_secret_arn" { type = string }

data "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = var.db_username_secret_arn
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_creds.secret_string)
}

resource "aws_db_subnet_group" "main" {
  name       = "cold-storage-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_instance" "main" {
  identifier           = "cold-storage-${var.environment}"
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = "db.t3.micro"
  db_name              = var.db_name
  username             = local.db_creds["username"]
  password             = local.db_creds["password"]
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]
  allocated_storage     = 20
  skip_final_snapshot    = true
  publicly_accessible    = false
  storage_encrypted      = true
  backup_retention_period = 1

  tags = {
    Name = "cold-storage-${var.environment}-db"
  }
}

output "endpoint" { 
  value = split(":", aws_db_instance.main.endpoint)[0] 
}
output "cluster_id" { 
  value = aws_db_instance.main.id 
}
