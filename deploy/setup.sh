#!/usr/bin/env bash
# Riva Tour bot — VPS ga birinchi marta o'rnatish.
# Serverda root sifatida ishga tushiriladi:  sudo bash setup.sh
set -euo pipefail

REPO="https://github.com/Dimonbek/riva-tour-bot.git"
APP_DIR="/opt/riva-tour-bot"
DATA_DIR="/var/lib/riva-tour-bot"
APP_USER="rivatour"
SERVICE="riva-tour-bot"
ENV_UPLOAD="/root/rivatour.env"          # Windows'dan scp bilan yuborilgan .env
DB_UPLOAD="/root/riva-data.db"           # Windows'dan scp bilan yuborilgan baza (ixtiyoriy)
SRC_UPLOAD="/root/riva-tour-src.tar.gz"  # Repo yopiq bo'lsa: scp bilan yuborilgan kod arxivi

say() { echo ""; echo "==> $*"; }

[ "$(id -u)" -eq 0 ] || { echo "XATO: root kerak. 'sudo bash setup.sh' deb ishga tushiring."; exit 1; }
[ -f "$ENV_UPLOAD" ] || { echo "XATO: $ENV_UPLOAD topilmadi. Avval .env faylni serverga yuboring."; exit 1; }

say "1/8  Paketlar o'rnatilmoqda"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
# build-essential va python3 — better-sqlite3 prebuilt binary topilmasa kompilyatsiya uchun
apt-get install -y -qq curl git ca-certificates build-essential python3 >/dev/null

say "2/8  Node.js 20 tekshirilmoqda"
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  CUR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  [ "$CUR" -ge 20 ] && { NEED_NODE=0; echo "    mavjud: $(node -v) — yetarli"; }
fi
if [ "$NEED_NODE" -eq 1 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
  echo "    o'rnatildi: $(node -v)"
fi

say "3/8  Swap tekshirilmoqda (exceljs eksporti paytida OOM ga qarshi)"
if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    1 GB swap qo'shildi"
else
  echo "    swap allaqachon bor — tegilmadi"
fi

say "4/8  Foydalanuvchi va papkalar"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --shell /usr/sbin/nologin --home-dir "$APP_DIR" "$APP_USER"
mkdir -p "$APP_DIR" "$DATA_DIR"

say "5/8  Kod yuklanmoqda"
# Repo yopiq bo'lsa serverda git clone ishlamaydi (GitHub hisobi yo'q).
# Shuning uchun kod arxiv ko'rinishida yuboriladi. Deploy key qo'yilgach
# git yo'li ham o'z-o'zidan ishlay boshlaydi — tartib shuni hisobga oladi.
if [ -f "$SRC_UPLOAD" ]; then
  tar -xzf "$SRC_UPLOAD" -C "$APP_DIR"
  echo "    arxivdan ochildi"
elif [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --quiet origin
  git -C "$APP_DIR" reset --hard --quiet origin/main
  echo "    git orqali yangilandi"
else
  git clone --quiet "$REPO" "$APP_DIR"
  echo "    klonlandi"
fi
mkdir -p "$APP_DIR/exports"

say "6/8  Sozlamalar (.env) va baza"
# PUBLIC_URL / WEBHOOK_URL / RAILWAY_* olib tashlanadi — ular bo'lsa bot webhook
# rejimiga o'tib ketadi. Bizga polling kerak: domen ham, SSL ham shart emas.
# PORT va DATA_DIR ham olinadi — ularni systemd unit beradi (3002, /var/lib/...).
# Windows'dan kelgani uchun CR belgilari ham tozalanadi.
sed $'s/\r$//' "$ENV_UPLOAD" \
  | grep -vE '^[[:space:]]*(PUBLIC_URL|WEBHOOK_URL|RAILWAY_[A-Z_]*|PORT|DATA_DIR)=' \
  > "$APP_DIR/.env" || true
grep -q '^BOT_TOKEN=' "$APP_DIR/.env" || { echo "XATO: .env da BOT_TOKEN yo'q — $ENV_UPLOAD ni tekshiring."; exit 1; }
chmod 600 "$APP_DIR/.env"
if [ -f "$DB_UPLOAD" ]; then
  if [ -f "$DATA_DIR/data.db" ]; then
    cp -a "$DATA_DIR/data.db" "$DATA_DIR/data.db.bak.$(date +%s)"
    echo "    eski baza zaxiralandi"
  fi
  mv "$DB_UPLOAD" "$DATA_DIR/data.db"
  echo "    baza ko'chirildi"
else
  echo "    baza yuborilmagan — bot bo'sh baza bilan boshlaydi"
  echo "    (adminlar, menejerlar, aloqa vaqtlari va guruh ID .env dan avtomatik tiklanadi)"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"

say "7/8  npm paketlari"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev --no-audit --no-fund 2>/dev/null \
  || sudo -u "$APP_USER" npm install --omit=dev --no-audit --no-fund

say "8/8  systemd servisi"
install -m 644 "$APP_DIR/deploy/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload
systemctl enable --quiet "$SERVICE"
systemctl restart "$SERVICE"
sleep 5

echo ""
echo "================= HOLAT ================="
systemctl status "$SERVICE" --no-pager --lines=15 || true
echo "========================================="
echo ""
echo "Loglarni jonli ko'rish:  journalctl -u $SERVICE -f"
echo "Qayta ishga tushirish:   systemctl restart $SERVICE"
echo "Baza joyi:               $DATA_DIR/data.db"
