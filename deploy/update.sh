#!/usr/bin/env bash
# Keyingi yangilanishlar uchun. Serverda:  sudo bash /opt/riva-tour-bot/deploy/update.sh
set -euo pipefail

APP_DIR="/opt/riva-tour-bot"
APP_USER="rivatour"
SERVICE="riva-tour-bot"

[ "$(id -u)" -eq 0 ] || { echo "XATO: root kerak."; exit 1; }

echo "==> Kod yangilanmoqda"
git -C "$APP_DIR" fetch --quiet origin
git -C "$APP_DIR" reset --hard --quiet origin/main

echo "==> Paketlar"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev --no-audit --no-fund 2>/dev/null \
  || sudo -u "$APP_USER" npm install --omit=dev --no-audit --no-fund

echo "==> systemd unit yangilanmoqda"
install -m 644 "$APP_DIR/deploy/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload

chown -R "$APP_USER:$APP_USER" "$APP_DIR"
systemctl restart "$SERVICE"
sleep 3
systemctl status "$SERVICE" --no-pager --lines=10
