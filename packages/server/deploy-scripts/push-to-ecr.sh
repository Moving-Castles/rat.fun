#!/bin/bash

# Configuration
AWS_REGION="eu-central-1"  # Change this to your region
ECR_REPOSITORY_NAME="rat-fun-server"
LOCAL_IMAGE_NAME="rat-fun-server"
TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting ECR push process...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if the local image exists
if ! docker images | grep -q "$LOCAL_IMAGE_NAME"; then
    echo -e "${RED}❌ Local image '$LOCAL_IMAGE_NAME' not found. Please build it first.${NC}"
    echo -e "${YELLOW}💡 Run: docker build -t $LOCAL_IMAGE_NAME .${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local image found: $LOCAL_IMAGE_NAME${NC}"

# Get AWS account ID
echo -e "${YELLOW}📋 Getting AWS account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to get AWS account ID. Please check your AWS credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Creating ECR repository if it doesn't exist...${NC}"
aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" 2>/dev/null || \
aws ecr create-repository --repository-name "$ECR_REPOSITORY_NAME" --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ECR repository ready: $ECR_REPOSITORY_NAME${NC}"
else
    echo -e "${RED}❌ Failed to create/verify ECR repository${NC}"
    exit 1
fi

# Get ECR login token and authenticate Docker
echo -e "${YELLOW}🔐 Authenticating with ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully authenticated with ECR${NC}"
else
    echo -e "${RED}❌ Failed to authenticate with ECR${NC}"
    exit 1
fi

# Tag the image for ECR
ECR_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$TAG"
echo -e "${YELLOW}🏷️  Tagging image for ECR...${NC}"
docker tag "$LOCAL_IMAGE_NAME:$TAG" "$ECR_IMAGE_URI"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image tagged: $ECR_IMAGE_URI${NC}"
else
    echo -e "${RED}❌ Failed to tag image${NC}"
    exit 1
fi

# Push the image to ECR
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push "$ECR_IMAGE_URI"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed image to ECR!${NC}"
    echo -e "${GREEN}🎉 ECR Image URI: $ECR_IMAGE_URI${NC}"
    echo -e "${YELLOW}💡 You can now use this URI in your Terraform configuration:${NC}"
    echo -e "${GREEN}   ecr_image = \"$ECR_IMAGE_URI\"${NC}"
else
    echo -e "${RED}❌ Failed to push image to ECR${NC}"
    exit 1
fi

# Clean up local ECR tag
echo -e "${YELLOW}🧹 Cleaning up local ECR tag...${NC}"
docker rmi "$ECR_IMAGE_URI"

echo -e "${GREEN}✅ Done! Your image is now available in ECR.${NC}" 