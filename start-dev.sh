#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_GWt0RdKkxI5o@ep-winter-firefly-adzez3fd-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_GWt0RdKkxI5o@ep-winter-firefly-adzez3fd.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NODE_OPTIONS="--max-old-space-size=8192"

while true; do
  echo "[$(date)] Starting Next.js..." > /home/z/my-project/dev.log
  npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Next.js exited with code $EXIT_CODE, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
