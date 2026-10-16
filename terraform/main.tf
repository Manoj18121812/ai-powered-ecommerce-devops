terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "terraform_execution_arn" {
  value = data.aws_caller_identity.current.arn
}


data "aws_vpc" "default" {
  default = true
}


output "default_vpc_id" {
  value = data.aws_vpc.default.id
}

output "default_vpc_cidr" {
  value = data.aws_vpc.default.cidr_block
}


data "aws_subnet" "existing_public" {
  id = "subnet-0f80d2e9a4d3542a0"
}

output "existing_subnet_id" {
  value = data.aws_subnet.existing_public.id
}

output "existing_subnet_az" {
  value = data.aws_subnet.existing_public.availability_zone
}

output "existing_subnet_cidr" {
  value = data.aws_subnet.existing_public.cidr_block
}





data "aws_security_group" "current_ec2" {
  id = "sg-09b4c83845fbedb8d"
}

output "current_security_group_id" {
  value = data.aws_security_group.current_ec2.id
}

output "current_security_group_name" {
  value = data.aws_security_group.current_ec2.name
}

output "current_security_group_vpc_id" {
  value = data.aws_security_group.current_ec2.vpc_id
}
