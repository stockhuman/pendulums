#!/bin/bash
# Starts all five pendulum servers & a vite local server. Ctrl-C kills them all.
trap 'kill 0' SIGINT SIGTERM EXIT

cd "$(dirname "$0")/pendulum-web"
pnpm run dev &
cd ../pendulum-srv

PORT=3001 STRING_LENGTH=1 MASS=3 ANCHOR=-2 PEER_URLS=http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005 pnpm start:dev &
PORT=3002 STRING_LENGTH=2 MASS=2 ANCHOR=-1 PEER_URLS=http://localhost:3001,http://localhost:3003,http://localhost:3004,http://localhost:3005 pnpm start:dev &
PORT=3003 STRING_LENGTH=0.2 MASS=1 ANCHOR=0  PEER_URLS=http://localhost:3001,http://localhost:3002,http://localhost:3004,http://localhost:3005 pnpm start:dev &
PORT=3004 STRING_LENGTH=2 MASS=0.6 ANCHOR=2 PEER_URLS=http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3005 pnpm start:dev &
PORT=3005 STRING_LENGTH=1 MASS=1.3 ANCHOR=3  PEER_URLS=http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004 pnpm start:dev &

wait
