# Riva Tour bot — VPS da o'rnatish

Railway o'rniga shaxsiy VPS. Bot **polling** rejimida ishlaydi, shuning uchun
domen, nginx va SSL sertifikat **kerak emas**.

Server: `root@189.74.99.109` (vps12090.eskiz.uz), Ubuntu 24.04

| Nima | Qayerda |
|---|---|
| Kod | `/opt/riva-tour-bot` |
| Baza | `/var/lib/riva-tour-bot/data.db` |
| Servis | `riva-tour-bot` |
| Foydalanuvchi | `rivatour` (root emas) |
| HTTP port | `3002` (`3000` ni `dilrabo-bot` egallagan) |

## Birinchi o'rnatish

Windows'da (PowerShell), loyiha papkasidan:

```powershell
# 1) Kod arxivi — repo yopiq bo'lgani uchun git clone serverda ishlamaydi
git archive --format=tar.gz -o riva-tour-src.tar.gz HEAD
scp riva-tour-src.tar.gz root@189.74.99.109:/root/
scp .env root@189.74.99.109:/root/rivatour.env

# 2) O'rnatish
ssh root@189.74.99.109 "bash /root/riva-tour-src-setup.sh"
```

Serverda:

```bash
mkdir -p /opt/riva-tour-bot
tar -xzf /root/riva-tour-src.tar.gz -C /opt/riva-tour-bot deploy/
bash /opt/riva-tour-bot/deploy/setup.sh
```

Baza ham ko'chirilsa, `scp` bilan `/root/riva-data.db` ga yuboring — `setup.sh`
uni o'zi `/var/lib/riva-tour-bot/data.db` ga qo'yadi. Yuborilmasa bot bo'sh
baza bilan boshlaydi; adminlar, menejerlar, aloqa vaqtlari va guruh ID
`.env` dan avtomatik tiklanadi (faqat so'rovnoma tarixi va foydalanuvchilar
ro'yxati yo'qoladi).

## Yangilash

```bash
ssh root@189.74.99.109 "bash /opt/riva-tour-bot/deploy/update.sh"
```

Repo yopiq bo'lsa `git fetch` serverda ishlamaydi — u holda yana arxiv yuboring
va `setup.sh` ni qayta ishga tushiring (baza `/var/lib` da, tegilmaydi).

## Kundalik buyruqlar

```bash
systemctl status riva-tour-bot
journalctl -u riva-tour-bot -f        # jonli log
systemctl restart riva-tour-bot
curl localhost:3002/health
```

## E'tibor bering

- `.env` da `PUBLIC_URL`, `WEBHOOK_URL`, `RAILWAY_*` **bo'lmasligi kerak** —
  bo'lsa bot webhook rejimiga o'tib ketadi va polling ishlamaydi.
  `setup.sh` bu qatorlarni o'zi filtrlaydi.
- `PORT` va `DATA_DIR` ni systemd unit beradi, `.env` emas (dotenv mavjud
  `process.env` ni bosmaydi).
- `.sh` va `.service` fayllar **LF** bo'lishi shart. `.gitattributes` buni
  qotirib qo'ygan — CRLF bo'lsa `bad interpreter: /bin/bash^M` chiqadi.
- Bot ishga tushganda `deleteWebhook` chaqiradi. Ya'ni VPS'dagi nusxa
  ishga tushgan zahoti Railway'dagi nusxa yangilanish qabul qilmay qoladi.
  Ikkisi birga ishlamaydi — bu ataylab shunday.
- CRM webhook (`CRM_WEBHOOK_URL`) hali ham Railway'dagi CRM'ga ishora qiladi.
  CRM ham ko'chirilsa, bu manzilni yangilash kerak. Bu bog'liqlik
  "fire-and-forget" — CRM ishlamasa ham bot normal ishlaydi, lead Telegram
  guruhiga baribir tushadi.
