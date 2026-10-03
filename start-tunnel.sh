#!/bin/bash
# Runner to start or check Cloudflare Tunnel for Tanka
PID=$(pgrep -f "cloudflared tunnel --url http://127.0.0.1:3001" | head -n 1)

if [ -n "$PID" ]; then
  echo "[tanka-tunnel] Cloudflare tunnel already running (PID: $PID)"
  exit 0
fi

echo "[tanka-tunnel] Starting Cloudflare tunnel on port 3001..."
nohup cloudflared tunnel --url http://127.0.0.1:3001 > /home/vallencia/Projects/tanka/tunnel.log 2>&1 &
TUNNEL_PID=$!

sleep 4
URL=$(grep -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' /home/vallencia/Projects/tanka/tunnel.log | head -n 1)
echo "[tanka-tunnel] Active at: $URL (PID: $TUNNEL_PID)"
