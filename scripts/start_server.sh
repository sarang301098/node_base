#!/usr/bin/env bash
set -e

echo "Deleting old images"
docker system prune -f 2>/dev/null; true

echo "Updating Docker Image"
docker login --username sarangpatel --password cloud@sarang_3010
docker pull sarangpatel/node-base-api:latest

docker rm -f node-base-api 2>> /dev/null
docker rmi sarangpatel/propane-bros-api:latest

docker run -d --name node-base-api --restart always -p 3333:3333 sarangpatel/node-base-api:latest
