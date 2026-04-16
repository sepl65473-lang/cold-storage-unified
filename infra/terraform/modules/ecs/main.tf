resource "aws_ecs_cluster" "main" {
  name = "cold-storage-${var.environment}-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "cold-storage-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = var.ecr_image_uri
      portMappings = [{ containerPort = 8000 }]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@${var.rds_endpoint}:5432/cold_storage" },
        { name = "REDIS_URL", value = "redis://${var.redis_endpoint}:6379/0" },
        { name = "ENVIRONMENT", value = var.environment }
      ]
      secrets = [
        { name = "DB_CREDENTIALS", valueFrom = var.db_secret_arn },
        { name = "APP_SECRETS", valueFrom = var.app_secrets_arn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
            "awslogs-group"         = "/ecs/cold-storage-backend-${var.environment}"
            "awslogs-region"        = "us-east-1"
            "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "careers" {
  family                   = "smaatech-careers"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "careers"
      image = var.careers_ecr_image_uri
      portMappings = [{ containerPort = 5000 }]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://cold_storage_user:c0CCSJfIbY68DqHZcjt3SkIJHRXkSuXr@${var.rds_endpoint}:5432/cold_storage" },
        { name = "NODE_ENV", value = "production" },
        { name = "ADMIN_EMAIL", value = "Info@smaatechengineering.com" },
        { name = "SESSION_SECRET", value = "smaatech-careers-session-prod-2026" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
            "awslogs-group"         = "/ecs/smaatech-careers-${var.environment}"
            "awslogs-region"        = "us-east-1"
            "awslogs-stream-prefix" = "careers"
        }
      }
    }
  ])
}

resource "aws_cloudwatch_log_group" "careers" {
  name              = "/ecs/smaatech-careers-${var.environment}"
  retention_in_days = 7
}

resource "aws_iam_role" "ecs_exec" {
  name = "ecs-exec-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec" {
  role       = aws_iam_role.ecs_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "ses_send" {
  name = "ses-send-policy-${var.environment}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# ─── Load Balancing ───────────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "cold-storage-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  tags = { Name = "cold-storage-alb-${var.environment}" }
}

resource "aws_lb_target_group" "app" {
  name        = "cold-storage-tg-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_target_group" "careers" {
  name        = "smaatech-careers-tg-${var.environment}"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/career" # server.js should have a basic health route or we can use /
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener_rule" "careers" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.careers.arn
  }

  condition {
    path_pattern {
      values = ["/api/jobs", "/api/apply", "/admin", "/admin/*", "/applications/*"]
    }
  }
}

# ─── ECS Service ──────────────────────────────────────────────────────────
resource "aws_ecs_service" "main" {
  name            = "backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "careers" {
  name            = "careers"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.careers.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.careers.arn
    container_name   = "careers"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.http]
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
