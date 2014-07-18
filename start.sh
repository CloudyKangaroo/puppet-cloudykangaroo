#! /bin/bash
#sudo /opt/boxen/homebrew/bin/redis-server /opt/boxen/config/redis/redis.conf;
REDIS_CLASS="fakeredis" CREDS_CLASS="./config/system-dev-credentials" MGMT_DOMAIN=".unittest.us" MON_CLASS="./lib/mockMonitoring" CRM_CLASS="cloudy-localsmith" USE_NOCK=true NODE_ENV=development PORT=3001 node src/app.js
