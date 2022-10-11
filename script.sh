#!/usr/bin/env bash
set -e
cd ~/
rm -r propane-api
mkdir propane-api
mv dist.zip propane-api/
cd propane-api/
unzip -o dist.zip
mv .env dist/
mv node_modules/ dist/
rm dist.zip
cd ~
chmod -R 775 propane-api/
cd propane-api/dist/
chmod 777 node_modules/
pm2 delete Propane-api
pm2 start server.js --name "Propane-api"
mkdir logs && sudo chmod 777 -R logs