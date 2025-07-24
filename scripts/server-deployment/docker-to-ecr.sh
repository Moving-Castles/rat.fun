#!/bin/bash

# Configuration
AWS_REGION="eu-central-1"  # Change this to your region
ECR_REPOSITORY_NAME="rat-fun-server"
LOCAL_IMAGE_NAME="rat-fun-server"
DOCKERFILE_PATH="packages/server/Dockerfile"

# Version handling
if [ -z "$1" ]; then
    # Generate version based on timestamp if no version provided
    VERSION=$(date +%Y%m%d-%H%M%S)
    echo -e "${YELLOW}📝 No version specified, using timestamp-based version: $VERSION${NC}"
else
    VERSION="$1"
fi

TAG="$VERSION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Docker build and ECR push process for version: $VERSION${NC}"

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

# Navigate to repository root (where pnpm-workspace.yaml is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${YELLOW}📁 Script location: $SCRIPT_DIR${NC}"
echo -e "${YELLOW}📁 Repository root: $REPO_ROOT${NC}"

# Check if we're in the right directory (should be repo root)
if [ ! -f "$REPO_ROOT/pnpm-workspace.yaml" ]; then
    echo -e "${RED}❌ Could not find pnpm-workspace.yaml in repository root${NC}"
    echo -e "${RED}❌ Expected location: $REPO_ROOT/pnpm-workspace.yaml${NC}"
    exit 1
fi

# Change to repository root
cd "$REPO_ROOT"
echo -e "${GREEN}✅ Changed to repository root: $(pwd)${NC}"

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
echo -e "${YELLOW}📋 Command: docker build --platform linux/amd64 -f $DOCKERFILE_PATH -t $LOCAL_IMAGE_NAME:latest .${NC}"

docker build --platform linux/amd64 -f "$DOCKERFILE_PATH" -t "$LOCAL_IMAGE_NAME:latest" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully: $LOCAL_IMAGE_NAME:latest${NC}"
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

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
aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" --output json 2>/dev/null | cat || \
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

# Tag the image for ECR with version
ECR_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$TAG"
echo -e "${YELLOW}🏷️  Tagging image for ECR with version: $VERSION${NC}"
docker tag "$LOCAL_IMAGE_NAME:latest" "$ECR_IMAGE_URI"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image tagged: $ECR_IMAGE_URI${NC}"
else
    echo -e "${RED}❌ Failed to tag image${NC}"
    exit 1
fi

# Also tag as latest for convenience
LATEST_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest"
echo -e "${YELLOW}🏷️  Also tagging as latest...${NC}"
docker tag "$LOCAL_IMAGE_NAME:latest" "$LATEST_IMAGE_URI"

# Push the versioned image to ECR
echo -e "${YELLOW}📤 Pushing versioned image to ECR...${NC}"
docker push "$ECR_IMAGE_URI"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed versioned image to ECR!${NC}"
else
    echo -e "${RED}❌ Failed to push versioned image to ECR${NC}"
    exit 1
fi

# Push the latest tag to ECR
echo -e "${YELLOW}📤 Pushing latest tag to ECR...${NC}"
docker push "$LATEST_IMAGE_URI"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed latest tag to ECR!${NC}"
else
    echo -e "${RED}❌ Failed to push latest tag to ECR${NC}"
    exit 1
fi

# Clean up local ECR tags
echo -e "${YELLOW}🧹 Cleaning up local ECR tags...${NC}"
docker rmi "$ECR_IMAGE_URI" "$LATEST_IMAGE_URI"

echo -e "${GREEN}✅ Done! Your image is now available in ECR.${NC}"
echo -e "${GREEN}🎉 Versioned Image URI: $ECR_IMAGE_URI${NC}"
echo -e "${GREEN}🎉 Latest Image URI: $LATEST_IMAGE_URI${NC}"
echo -e "${YELLOW}💡 For Terraform, use the versioned URI to trigger restarts:${NC}"
echo -e "${GREEN}   ecr_image = \"$ECR_IMAGE_URI\"${NC}"
echo -e "${YELLOW}💡 Usage: ./docker-to-ecr.sh [version]${NC}"
echo -e "${YELLOW}   Examples:${NC}"
echo -e "${YELLOW}     ./docker-to-ecr.sh v1.0.0${NC}"
echo -e "${YELLOW}     ./docker-to-ecr.sh 20241201-143022${NC}"
echo -e "${YELLOW}     ./docker-to-ecr.sh (auto-generates timestamp version)${NC}" 