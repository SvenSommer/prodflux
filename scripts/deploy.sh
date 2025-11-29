#!/bin/bash
# Deploy Script for Prodflux
# Triggers deployment on Render.com via Deploy Hooks

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -E '^DEPLOY_HOOK_' .env | xargs)
elif [ -f ../.env ]; then
    export $(grep -E '^DEPLOY_HOOK_' ../.env | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🚀 Prodflux Deploy Script${NC}"
echo "=========================="
echo ""

# Show options
show_help() {
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  frontend    Deploy only frontend"
    echo "  backend     Deploy only backend"
    echo "  all         Deploy both frontend and backend"
    echo "  help        Show this help message"
    echo ""
}

deploy_frontend() {
    if [ -z "$DEPLOY_HOOK_FRONTEND" ]; then
        echo -e "${RED}❌ DEPLOY_HOOK_FRONTEND not set in .env${NC}"
        return 1
    fi
    echo -e "${YELLOW}📦 Deploying Frontend...${NC}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_HOOK_FRONTEND")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ Frontend deployment triggered successfully!${NC}"
    else
        echo -e "${RED}❌ Frontend deployment failed (HTTP $response)${NC}"
        return 1
    fi
}

deploy_backend() {
    if [ -z "$DEPLOY_HOOK_BACKEND" ]; then
        echo -e "${RED}❌ DEPLOY_HOOK_BACKEND not set in .env${NC}"
        return 1
    fi
    echo -e "${YELLOW}📦 Deploying Backend...${NC}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_HOOK_BACKEND")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ Backend deployment triggered successfully!${NC}"
    else
        echo -e "${RED}❌ Backend deployment failed (HTTP $response)${NC}"
        return 1
    fi
}

# Parse command line argument
case "${1:-all}" in
    frontend|f)
        deploy_frontend
        ;;
    backend|b)
        deploy_backend
        ;;
    all|a)
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    help|h|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📋 Check deployment status at:${NC}"
echo "   https://dashboard.render.com"
echo ""
