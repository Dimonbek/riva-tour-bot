# Texnik Topshiriq (TZ) - Karabas Revo Tour Bot

## 1. Loyiha maqsadi
"Karabas Revo Tour" turistik kompaniyasi uchun mijozlardan sayohatga oid birlamchi ma'lumotlarni yig'uvchi va yig'ilgan ma'lumotlarni menejerlar guruhiga yuboruvchi Telegram bot yaratish.

## 2. Funksional talablar

### 2.1. Til tanlovi
Botga kirganda (`/start` buyrug'idan so'ng) mijozga tilni tanlash taklif qilinadi:
- O'zbek tili
- Rus tili
*(Tanlov Inline yoki Reply Keyboard tugmalari orqali amalga oshiriladi)*

### 2.2. So'rovnoma ketma-ketligi
Til tanlangandan so'ng, mijozdan quyidagi ma'lumotlar so'raladi:

1. **Ism, familiya:** "Ism familiyangizni kiriting" (Qo'lda matn kiritiladi).
2. **Yo'nalish:** "Qayerga uchmoqchisiz?" 
   *Izoh:* Masalan, Dubay yoki Arabistonga (Qo'lda kiritiladi).
3. **Sana:** "Qachon uchmoqchisiz?" 
   *Izoh/Namuna:* Masalan, 19-avgust (Qo'lda kiritiladi).
4. **Kishilar soni:** "Necha kishi?" (Qo'lda kiritiladi).
5. **Bolalar:** "Bolalar bormi?"
   *Tugmalar:* [Ha] / [Yo'q]
   * Agar **"Yo'q"** tanlansa, to'g'ridan-to'g'ri 6-qadamga (Qachon bog'lanish mumkinligiga) o'tiladi.
   * Agar **"Ha"** tanlansa:
     - 5.1. "Bolalar nechtaligini kiriting" (Qo'lda kiritiladi).
     - 5.2. "Yoshlari nechida?" (Qo'lda kiritiladi).
6. **Bog'lanish vaqti:** "Qachon telefon qilish mumkin?"
   *Tugmalar:*
   - [10:00 dan 11:00 gacha]
   - [13:00 dan 14:00 gacha]
   - [16:00 dan 18:00 gacha]
   - [18:00 dan 21:00 gacha]
7. **Telefon raqam:** "Telefon raqamingizni kiriting"
   *Tugma:* [Telefon raqamini yuborish (Share Contact)] (Telegram'ning o'rnatilgan funksiyasidan foydalanib yuboriladi).
8. **Yakun:** "Menejerlarimiz siz bilan bog'lanishadi." deb yoziladi.

### 2.3. Ma'lumotlarni guruhga yuborish
Mijoz barcha savollarga javob bergandan so'ng, barcha to'plangan ma'lumotlar chiroyli formatda kompaniyaning maxsus Telegram guruhiga yuboriladi.
*Yuboriladigan xabar strukturasi:*
- 👤 Ismi: ...
- 📍 Yo'nalish: ...
- 📅 Sana: ...
- 👥 Odam soni: ...
- 👶 Bolalar: Bor (2 ta, yoshlari: 3, 5) / Yo'q
- 📞 Telefon qulay vaqt: ...
- 📱 Raqam: ...

## 3. Texnik talablar
- **Dasturlash tili:** Node.js
- **Kutubxona:** Telegraf (Telegraf Scenes yoki Wizard orqali State Management qilinadi).
- **Muhit o'zgaruvchilari (.env):** `BOT_TOKEN` va `GROUP_ID`.
