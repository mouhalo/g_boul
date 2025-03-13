#!/bin/bash
cd /var/www/gereboul
git pull
npm install
npm run build
pm2 restart g_boul
