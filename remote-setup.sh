#!/bin/bash

# Configuration
APP_DIR="/opt/g_boul"

# Create necessary directories
mkdir -p $APP_DIR/certbot/conf $APP_DIR/certbot/www

# Stop any running containers
cd $APP_DIR
docker compose -f docker-compose.prod.yml down || true

# Build and start containers
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "Deployment completed!"
