# POLARIS Infrastructure: EC2 Host & IAM Setup

## 1. AWS IAM Instance Profile Setup
To call Amazon Bedrock without storing static credentials on disk:

```bash
# 1. Create IAM Role with EC2 trust policy
aws iam create-role \
  --role-name polaris-ec2-bedrock-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }'

# 2. Attach Bedrock policy
aws iam put-role-policy \
  --role-name polaris-ec2-bedrock-role \
  --policy-name BedrockConverseAccess \
  --policy-document file://infra/iam-role.json

# 3. Create and attach instance profile
aws iam create-instance-profile --instance-profile-name polaris-ec2-profile
aws iam add-role-to-instance-profile --instance-profile-name polaris-ec2-profile --role-name polaris-ec2-bedrock-role
```

## 2. Launching the EC2 Host
1. Launch an Ubuntu 22.04 / 24.04 instance (recommended: `g4dn.xlarge` for GPU Decider, or `t3.medium` for CPU Decider / backend proxy).
2. Attach the `polaris-ec2-profile` instance profile.
3. Open inbound ports `80` (HTTP) and `443` (HTTPS) in the security group.

## 3. Provisioning Services
```bash
# Run host setup
curl -fsSL https://raw.githubusercontent.com/your-org/polaris/deployment/infra/setup.sh | bash

# Copy systemd unit files
sudo cp infra/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now decider polaris-api

# Start Caddy
sudo cp infra/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
