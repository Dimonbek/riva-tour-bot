# Loyihani Amalga Oshirish Rejasi (PLAN)

Ushbu hujjat Karabas Revo Tour botini yaratish bo'yicha qadam-baqadam ko'rsatmalarni o'z ichiga oladi. Claude yordamida loyihani qurishda shu qadamlarga amal qilinadi.

## 1-qadam: Loyihani initsializatsiya qilish
1. Node.js o'rnatilganligiga ishonch hosil qilish.
2. Yangi papka ochib, terminalda `npm init -y` komandasini berish.
3. Kerakli paketlarni o'rnatish: `npm install telegraf dotenv`

## 2-qadam: Fayl strukturasini shakllantirish
Loyihada quyidagi fayllar yaratilishi kerak:
- `index.js` (Botning asosiy ishlash mantiqi joylashgan fayl)
- `.env` (Maxfiy ma'lumotlar: BOT_TOKEN, GROUP_ID)
- `locales.js` (O'zbek va Rus tillaridagi barcha matnlarni o'z ichiga olgan obyektlar)

## 3-qadam: Tarjima va matnlar faylini sozlash (locales.js)
`locales.js` faylida ikkita asosiy obyekt yaratiladi (`uz` va `ru`). Har bir obyekt ichida bot yuboradigan barcha savollar va tugmalar matni saqlanadi. Masalan:
```javascript
const locales = {
  uz: {
    welcome: "Xush kelibsiz! Tilni tanlang:",
    askName: "Ism familiyangizni kiriting:",
    // ... va hokazo
  },
  ru: {
    welcome: "Добро пожаловать! Выберите язык:",
    askName: "Введите ваше имя и фамилию:",
    // ... va hokazo
  }
}
```

## 4-qadam: State Management (Telegraf Wizard Scene)
Bot mijozdan qadamba-qadam ma'lumot so'rashi uchun Telegraf kutubxonasining `WizardScene` va `session` funksiyalaridan foydalaniladi.
1. **Scene yaratish:** Foydalanuvchi ma'lumotlarini qabul qiluvchi oqim (Wizard) yaratish.
2. **Qadamlar logikasi:**
   - *1-qadam:* Tilni tanlashini kutish.
   - *2-qadam:* Ismni qabul qilish va manzilni so'rash.
   - *3-qadam:* Manzilni qabul qilish va sanani so'rash.
   - *4-qadam:* Sanani qabul qilish va odam sonini so'rash.
   - *5-qadam:* Odam sonini qabul qilish va "Bolalar bormi?" tugmalarini chiqarish.
   - *6-qadam:* Agar "Yo'q" bossa to'g'ridan-to'g'ri bog'lanish vaqtini so'rash. Agar "Ha" bossa, bolalar sonini, keyin yoshini so'rash.
   - *7-qadam:* Bog'lanish vaqtini qabul qilib, kontakt so'rash (`request_contact: true` tugmasi orqali).
   - *8-qadam:* Kontakt qabul qilinishi bilanoq, barcha sessiya (session) dagi ma'lumotlarni yig'ish.

## 5-qadam: Ma'lumotlarni Guruhga yuborish
Foydalanuvchi so'nggi qadamga yetganda:
1. `ctx.session` dagi barcha ma'lumotlar formati chiroyli xabar ko'rinishiga keltiriladi.
2. `bot.telegram.sendMessage(process.env.GROUP_ID, xabar)` orqali guruhga uzatiladi.
3. Mijozga "Menejerlarimiz siz bilan bog'lanishadi" degan yakuniy matn yuboriladi va sessiya tozalanadi (`ctx.scene.leave()`).

## 6-qadam: Test qilish va ishga tushirish
1. `.env` ga haqiqiy token va guruh ID kiritish.
2. `node index.js` komandasi orqali botni ishga tushirish.
3. Telegram orqali `/start` bosib, barcha senariylar (bolalar bor/yo'q, rus/o'zbek) to'g'ri ishlashini tekshirib chiqish.
