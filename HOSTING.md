# Botni 24/7 ishlashi uchun Hosting

## Avval — Guruh ID muammosini hal qilish

Sizning xatoligingiz: `chat not found`. Bot guruhda admin, lekin ID noto'g'ri.

**Eng oson yo'l:**

1. Botingizni guruhdan chiqaring va qaytadan qo'shing (admin sifatida).
2. Bot qo'shilgan zahoti **Super Adminga** (sizga) shaxsiy xabar yuboradi:
   ```
   Bot guruhga qo'shildi!
   Guruh nomi: ...
   Guruh ID: -1001234567890   ← TO'G'RI ID
   ```
3. Bu ID ni `.env` faylda `GROUP_ID` ga yozing yoki:
   - Botda `/admin` → Sozlamalar → 🆔 Guruh ID o'zgartirish → yangi ID kiriting

**Yoki:**
- Guruhda `/chatid` deb yozing — bot to'g'ri ID ni javob beradi.

---

## Hosting: Railway.app (BEPUL, eng oson)

Railway har oy $5 bepul kredit beradi — bitta bot uchun yetadi (taxminan 500 soat).

### 1-qadam: GitHub akkaunt

[github.com](https://github.com) ga kiring va akkaunt yarating (agar yo'q bo'lsa).

### 2-qadam: Loyihani GitHub'ga yuklash

Terminal'da bot papkasida:

```bash
cd "C:\Users\Lenovo\Documents\bot\Telegram bot"
git init
git add .
git commit -m "Initial commit"
```

GitHub'da yangi **private** repository yarating (masalan: `riva-tour-bot`), keyin:

```bash
git remote add origin https://github.com/SIZNING_USERNAME/riva-tour-bot.git
git branch -M main
git push -u origin main
```

⚠️ **MUHIM:** `.env` fayl `.gitignore` da bor — token GitHub'ga yuklanmaydi.

### 3-qadam: Railway'ga deploy

1. [railway.app](https://railway.app) ga kiring → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → loyihangizni tanlang
3. Railway avtomatik `npm install` va `npm start` ni bajaradi

### 4-qadam: Environment Variables

Railway loyiha sahifasida → **Variables** tab → quyidagilarni qo'shing:

| KEY | VALUE |
|-----|-------|
| `BOT_TOKEN` | `8819031194:AAFpQqjWdRESiQEemclYA0niA-E5Bc8TcBE` |
| `GROUP_ID` | `-1005170161620` *(to'g'ri ID — yuqorida ko'rsatilgan usul bilan oling)* |
| `SUPER_ADMIN_ID` | `6220576519` |
| `ADMIN_IDS` | `6220576519,1340548511` |

### 5-qadam: Volume (DB saqlash uchun)

Railway'da loyihangiz → **Settings** → **Volumes** → **Add Volume**:
- **Mount path:** `/app/data`

So'ng `database.js` da bazaning yo'lini volume'ga ko'rsatish kerak. Buni avtomatik qilib qo'yganman — Railway'da `DATA_DIR=/app/data` environment variable qo'shsangiz, baza shu yerda saqlanadi.

### 6-qadam: Deploy

Railway avtomatik deploy qiladi. **Logs** tab'ida `Bot ishga tushdi!` ko'rinsa — tayyor!

Bot endi **24/7 ishlaydi** — kompyuteringizni o'chirsangiz ham.

---

## Muqobil: VPS (oyiga ~$4)

To'liq nazorat kerak bo'lsa:

1. **Hetzner Cloud** (€4/oy) yoki **DigitalOcean** ($4/oy) dan VPS oling
2. Ubuntu serverda:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs git build-essential
   git clone https://github.com/SIZNING_USERNAME/riva-tour-bot.git
   cd riva-tour-bot
   npm install
   nano .env  # token va ID larni yozing
   npm install -g pm2
   pm2 start index.js --name riva-bot
   pm2 save
   pm2 startup
   ```

3. `pm2 logs riva-bot` — loglarni ko'rish

---

## Yordam

Qaysi variantni tanlasangiz — Railway tavsiya. Har qadamda yordam beraman.
