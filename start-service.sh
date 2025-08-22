#!/bin/bash

# Build and run the OpenAI Chat service
echo "Building OpenAI Chat Docker image..."
docker build -t openai-chat .

echo "Stopping existing container if running..."
docker stop openai-chat-app 2>/dev/null || true
docker rm openai-chat-app 2>/dev/null || true

echo "Starting OpenAI Chat on port 3002..."
docker run -d --name openai-chat-app -p 3002:3000 --env-file .env.local openai-chat

echo "OpenAI Chat is running! Check with: docker ps"
echo "View logs with: docker logs openai-chat-app"
