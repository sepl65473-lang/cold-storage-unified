variable "environment" { type = string }
variable "aws_region" { type = string }

resource "aws_s3_bucket" "firmware" {
  bucket = "cold-storage-firmware-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "archives" {
  bucket = "cold-storage-archives-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "web" {
  bucket = "cold-storage-web-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# Enable versioning on all buckets
resource "aws_s3_bucket_versioning" "firmware" {
  bucket = aws_s3_bucket.firmware.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_versioning" "archives" {
  bucket = aws_s3_bucket.archives.id
  versioning_configuration { status = "Enabled" }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "firmware" {
  bucket                  = aws_s3_bucket.firmware.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "archives" {
  bucket                  = aws_s3_bucket.archives.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Encrypt all buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "firmware" {
  bucket = aws_s3_bucket.firmware.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "archives" {
  bucket = aws_s3_bucket.archives.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# Lifecycle: Aggregate archives → Glacier after 2 years
resource "aws_s3_bucket_lifecycle_configuration" "archives" {
  bucket = aws_s3_bucket.archives.id
  rule {
    id     = "aggregates-to-glacier"
    status = "Enabled"
    filter { prefix = "aggregates/" }
    transition {
      days          = 730  # 2 years
      storage_class = "GLACIER"
    }
  }
}

# Object Lock for audit logs (WORM — 7 year compliance)
resource "aws_s3_bucket_object_lock_configuration" "archives" {
  bucket = aws_s3_bucket.archives.id
  rule {
    default_retention {
      mode  = "COMPLIANCE"
      years = 7
    }
  }
}

variable "cloudfront_distribution_arns" {
  type    = list(string)
  default = []
}

output "firmware_bucket"  { value = aws_s3_bucket.firmware.bucket }
output "archives_bucket"  { value = aws_s3_bucket.archives.bucket }
output "web_bucket"       { value = aws_s3_bucket.web.bucket }
output "web_bucket_id"    { value = aws_s3_bucket.web.id }
output "web_bucket_domain_name" { value = aws_s3_bucket.web.bucket_regional_domain_name }

resource "aws_s3_bucket_policy" "web_distribution" {
  count  = var.environment == "prod" ? 1 : 0
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.web.arn,
          "${aws_s3_bucket.web.arn}/*"
        ]
        Condition = {
          StringEquals = {
          "AWS:SourceArn" = var.cloudfront_distribution_arns
          }
        }
      }
    ]
  })
}

