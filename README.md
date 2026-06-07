# Karabas Revo Tour Bot

Telegram bot — turistik so'rovlarni qabul qilish va menejerlar guruhiga yuborish.

## Funksiyalar

- O'zbek va Rus tillarida so'rovnoma
- 8 qadamli ma'lumot yig'ish (ism, yo'nalish, sana, odam soni, bolalar, vaqt, telefon)
- Istalgan paytda tilni o'zgartirish
- Ma'lumotlar SQLite bazasiga saqlanadi
- Maxsus guruhga avtomatik yuborish
- **Admin panel** bot ichida:
  - 📊 Statistika (bugun/hafta/oy, yo'nalishlar, vaqtlar)
  - 📥 Excel eksport
  - 📢 Barcha foydalanuvchilarga xabar (broadcast)
  - ✏️ Bot matnlarini tahrirlash
  - 🕐 Bog'lanish vaqtlarini boshqarish
  - 🚫 Foydalanuvchilarni bloklash
  - 👥 Adminlar ro'yxati (Super Admin uchun)
  - ⚙️ Sozlamalar (botni yoqish/o'chirish, guruh ID)

## O'rnatish

```bash
npm install
```

## Sozlash

`.env` faylida quyidagilarni belgilang:

```
BOT_TOKEN=your_bot_token
GROUP_ID=your_group_id
SUPER_ADMIN_ID=your_telegram_id
ADMIN_IDS=id1,id2,id3
```

## Ishga tushirish

```bash
npm start
```

Yoki development rejimida (avtomatik qayta yuklash):

```bash
npm run dev
```

## Buyruqlar

**Foydalanuvchi uchun:**
- `/start` — so'rovnomani boshlash
- `/myid` — o'z Telegram ID ingizni bilish
- `/help` — yordam

**Adminlar uchun:**
- `/admin` — admin panelga kirish

## Fayl strukturasi

```
.
├── index.js              # Asosiy fayl
├── package.json
├── .env                  # Maxfiy ma'lumotlar
├── data.db               # SQLite ma'lumotlar bazasi (avtomatik yaratiladi)
└── src/
    ├── database.js       # DB API va sxema
    ├── locales.js        # Tarjimalar
    ├── keyboards.js      # Klaviaturalar
    └── scenes/
        ├── survey.js     # So'rovnoma scenasi
        └── admin.js      # Admin panel scenasi
```

## Eslatmalar

- **Super Admin** — `.env` dagi `SUPER_ADMIN_ID`. Faqat super admin boshqa adminlarni qo'sha/o'chira oladi.
- **Bot guruhga qo'shilishi** kerak (admin huquqlari bilan) — aks holda xabarlar yuborilmaydi.
- Ma'lumotlar bazasi `data.db` faylida saqlanadi — bekap olishni unutmang.
- Excel eksport `exports/` papkasiga vaqtinchalik saqlanadi va yuborilgandan keyin o'chiriladi.

## Texnologiyalar

- Node.js 18+
- Telegraf 4.x
- better-sqlite3
- ExcelJS
