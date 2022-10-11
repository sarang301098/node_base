#!/usr/bin/env bash
set -e

echo "Deleting old images"
docker system prune -f 2>/dev/null; true

echo "Updating Docker Image"
docker login --username cloudpeerbits --password cloud@peerbits123
docker pull cloudpeerbits/propane-bros-api:latest

docker rm -f propane-bros-api 2>> /dev/null
docker rmi cloudpeerbits/propane-bros-api:latest

docker run -d --name propane-bros-api --restart always -p 3333:3333 cloudpeerbits/propane-bros-api:latest