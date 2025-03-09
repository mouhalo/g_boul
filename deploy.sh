#!/bin/bash

# Variables
REMOTE_HOST="154.12.224.173"
REMOTE_PORT="1022"
REMOTE_USER="root"
APP_NAME="g_boul"
REMOTE_DIR="/opt/$APP_NAME"

# Create a temporary directory for the build
echo "Creating deployment package..."
mkdir -p deploy
cp -r Dockerfile docker-compose.prod.yml nginx.conf .dockerignore next.config.js package*.json src public deploy/

# Create required directories on remote server
echo "Setting up remote server directories..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR/certbot/conf $REMOTE_DIR/certbot/www"

# Transfer files to remote server
echo "Transferring files to remote server..."
scp -P $REMOTE_PORT -r deploy/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

# Build and deploy on remote server
echo "Building and deploying on remote server..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && \
    docker compose -f docker-compose.prod.yml down && \
    docker compose -f docker-compose.prod.yml build --no-cache && \
    docker compose -f docker-compose.prod.yml up -d"

# Cleanup
echo "Cleaning up..."
rm -rf deploy

echo "Deployment completed! Application should be accessible at http://$REMOTE_HOST"
