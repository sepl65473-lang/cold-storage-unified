variable "environment" { type = string }

# IoT Core Policy — devices can publish/subscribe only to their own org/device topics
resource "aws_iot_policy" "device_policy" {
  name = "cold-storage-device-policy-${var.environment}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["iot:Connect"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["iot:Publish"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["iot:Subscribe", "iot:Receive"]
        Resource = "*"
      }
    ]
  })
}

# SQS queue for telemetry fan-out via IoT Rule
resource "aws_sqs_queue" "telemetry_ingest" {
  name                      = "cold-storage-telemetry-${var.environment}"
  message_retention_seconds = 86400  # 24 hours
  visibility_timeout_seconds = 60
  receive_wait_time_seconds  = 20    # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.telemetry_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "telemetry_dlq" {
  name                      = "cold-storage-telemetry-dlq-${var.environment}"
  message_retention_seconds = 604800  # 7 days
}

# IoT Rule: forward telemetry MQTT messages → SQS
resource "aws_iot_topic_rule" "telemetry_to_sqs" {
  name        = "cold_storage_telemetry_to_sqs_${var.environment}"
  enabled     = true
  sql         = "SELECT *, topic(2) as org_id, topic(3) as device_id FROM 'coldstorage/+/+/telemetry'"
  sql_version = "2016-03-23"

  sqs {
    queue_url  = aws_sqs_queue.telemetry_ingest.url
    role_arn   = aws_iam_role.iot_rule_role.arn
    use_base64 = false
  }

  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/cold-storage/${var.environment}/rule-errors"
      role_arn       = aws_iam_role.iot_rule_role.arn
    }
  }
}

# LWT rule — mark device offline when connection drops
resource "aws_iot_topic_rule" "lwt_to_sqs" {
  name        = "cold_storage_lwt_${var.environment}"
  enabled     = true
  sql         = "SELECT *, topic(2) as org_id, topic(3) as device_id FROM 'coldstorage/+/+/status'"
  sql_version = "2016-03-23"

  sqs {
    queue_url  = aws_sqs_queue.telemetry_ingest.url
    role_arn   = aws_iam_role.iot_rule_role.arn
    use_base64 = false
  }
}

resource "aws_iam_role" "iot_rule_role" {
  name = "cold-storage-iot-rule-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "iot.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "iot_rule_sqs" {
  role = aws_iam_role.iot_rule_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.telemetry_ingest.arn
    },
    {
      Effect   = "Allow"
      Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "*"
    }]
  })
}

output "telemetry_queue_url"  { value = aws_sqs_queue.telemetry_ingest.url }
output "telemetry_queue_arn"  { value = aws_sqs_queue.telemetry_ingest.arn }
output "device_policy_name"   { value = aws_iot_policy.device_policy.name }
