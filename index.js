require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const express = require('express');
const { dbApi, init } = require('./src/database');
const { t } = require('./src/locales');
const { survey, SURVEY_SCENE } = require('./src/scenes/survey');
const { admin, ADMIN_SCENE } = require('./src/scenes/admin');
const kb = require('./src/keyboards');

if (!process.env.BOT_TOKEN) {
  console.error('XATO: BOT_TOKEN .env faylda topilmadi!');
  process.exit(1);
}

init();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([survey, admin]);

bot.on('my_chat_member', async (ctx) => {
  try {
    const chat = ctx.myChatMember.chat;
    const status = ctx.myChatMember.new_chat_member.status;
    if ((chat.type === 'group' || chat.type === 'supergroup') &&
        (status === 'member' || status === 'administrator')) {
      const superAdmin = process.env.SUPER_ADMIN_ID;
      if (superAdmin) {
        await ctx.telegram.sendMessage(
          superAdmin,
          "Bot guruhga qo'shildi!\n\nGuruh nomi: " + chat.title + "\nGuruh ID: " + chat.id + "\nTur: " + chat.type
        );
      }
      console.log("Bot guruhga qo'shildi:", chat.title, "ID:", chat.id);
    }
  } catch (e) {
    console.error('my_chat_member xato:', e.message);
  }
});

bot.command('chatid', async (ctx) => {
  await ctx.reply('Chat ID: `' + ctx.chat.id + '`\nTur: ' + ctx.chat.type, { parse_mode: 'Markdown' });
});

bot.use(session());
bot.use(stage.middleware());

bot.use(async (ctx, next) => {
  if (ctx.chat && (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup')) {
    return next();
  }
  if (ctx.from) {
    try {
      dbApi.upsertUser(ctx.from);
    } catch (e) {
      console.error('upsertUser xato:', e.message);
    }
    if (!dbApi.isAdmin(ctx.from.id) && dbApi.isBlocked(ctx.from.id)) {
      const lang = dbApi.getUserLanguage(ctx.from.id) || 'uz';
      return ctx.reply(t(lang, 'blocked'));
    }
    if (!dbApi.isAdmin(ctx.from.id) && dbApi.getSetting('bot_active') !== '1') {
      const lang = dbApi.getUserLanguage(ctx.from.id) || 'uz';
      return ctx.reply(t(lang, 'botInactive'));
    }
  }
  return next();
});

bot.command('start', async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  if (ctx.session) {
    ctx.session.surveyData = {};
    ctx.session.state = null;
  }
  return ctx.scene.enter(SURVEY_SCENE);
});

bot.command(['til', 'language'], async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  const lang = (ctx.session && ctx.session.lang) || dbApi.getUserLanguage(ctx.from.id) || 'uz';
  await ctx.reply(t(lang, 'chooseLanguage'), kb.languageInline());
});

bot.action(/^lang_(uz|ru)$/, async (ctx) => {
  const newLang = ctx.match[1];
  if (ctx.session) ctx.session.lang = newLang;
  dbApi.setUserLanguage(ctx.from.id, newLang);
  await ctx.answerCbQuery(newLang === 'uz' ? "O'zbek tili tanlandi" : 'Выбран русский язык');
  try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
  const msg = newLang === 'uz'
    ? "Til o'zgartirildi. Boshlash uchun /start"
    : 'Язык изменён. Для начала /start';
  await ctx.reply(msg);
});

bot.command('admin', async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  if (!dbApi.isAdmin(ctx.from.id)) {
    return ctx.reply("Sizda admin huquqlari yo'q.");
  }
  return ctx.scene.enter(ADMIN_SCENE);
});

bot.command('myid', async (ctx) => {
  await ctx.reply('Sizning Telegram ID: `' + ctx.from.id + '`', { parse_mode: 'Markdown' });
});

bot.command('help', async (ctx) => {
  const isAdmin = ctx.from && dbApi.isAdmin(ctx.from.id);
  let msg = "/start - Boshlash\n/til - Tilni o'zgartirish\n/chatid - Chat ID\n/myid - Telegram ID";
  if (isAdmin) msg += '\n/admin - Admin panel';
  await ctx.reply(msg);
});

bot.catch((err, ctx) => {
  console.error('Bot xatosi:', err);
});

async function setBotCommands() {
  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: "Boshlash / Начать" },
      { command: 'til', description: "Tilni o'zgartirish / Сменить язык" },
      { command: 'help', description: "Yordam / Помощь" },
    ]);
    const admins = dbApi.getAdmins();
    for (const a of admins) {
      try {
        await bot.telegram.setMyCommands(
          [
            { command: 'start', description: "Boshlash" },
            { command: 'admin', description: "Admin panel" },
            { command: 'til', description: "Tilni o'zgartirish" },
            { command: 'chatid', description: "Chat ID" },
            { command: 'myid', description: "Telegram ID" },
            { command: 'help', description: "Yordam" },
          ],
          { scope: { type: 'chat', chat_id: a.telegram_id } }
        );
      } catch (e) { /* normal */ }
    }
  } catch (e) {
    console.error('setMyCommands xato:', e.message);
  }
}

// HTTP server
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running! Riva Tour Bot — ' + new Date().toISOString());
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ============ WEBHOOK YOKI POLLING ============
async function startBot() {
  // Eski webhook ni tozalash
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('Eski webhook tozalandi');
  } catch (e) {
    console.error('deleteWebhook xato:', e.message);
  }

  // Railway public URL ni aniqlash
  const publicUrl = process.env.PUBLIC_URL
    || process.env.WEBHOOK_URL
    || (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : null);

  if (publicUrl) {
    // WEBHOOK rejimi
    const secretPath = '/telegraf/' + bot.secretPathComponent();
    app.use(bot.webhookCallback(secretPath));

    app.listen(PORT, async () => {
      console.log('HTTP server (webhook) port:', PORT);
      try {
        await bot.telegram.setWebhook(publicUrl + secretPath, {
          drop_pending_updates: true,
        });
        await setBotCommands();
        console.log('✅ WEBHOOK rejimida ishga tushdi:', publicUrl + secretPath);
        console.log('Guruh ID:', dbApi.getSetting('group_id') || process.env.GROUP_ID);
        console.log('Super Admin:', process.env.SUPER_ADMIN_ID);
      } catch (err) {
        console.error('setWebhook xato:', err.message);
      }
    });
  } else {
    // POLLING rejimi (lokal yoki URL yo'q)
    app.listen(PORT, () => {
      console.log('HTTP server (polling) port:', PORT);
    });

    await new Promise(r => setTimeout(r, 3000));
    try {
      await bot.launch({ dropPendingUpdates: true });
      await setBotCommands();
      console.log('✅ POLLING rejimida ishga tushdi');
      console.log('Guruh ID:', dbApi.getSetting('group_id') || process.env.GROUP_ID);
      console.log('Super Admin:', process.env.SUPER_ADMIN_ID);
    } catch (err) {
      console.error('Bot launch xato:', err.message);
      setTimeout(() => startBot().catch(e => console.error(e.message)), 30000);
    }
  }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
