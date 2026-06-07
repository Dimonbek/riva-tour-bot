require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
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

// Bot guruhga qo'shilganini ushlash
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
          'Bot guruhga qo\'shildi!\n\n' +
          'Guruh nomi: ' + chat.title + '\n' +
          'Guruh ID: ' + chat.id + '\n' +
          'Tur: ' + chat.type + '\n\n' +
          'Bu ID ni .env faylda GROUP_ID sifatida yozing yoki\n' +
          '/admin -> Sozlamalar -> Guruh ID o\'zgartirish orqali kiriting.'
        );
      }
      console.log('Bot guruhga qo\'shildi:', chat.title, 'ID:', chat.id);
    }
  } catch (e) {
    console.error('my_chat_member xato:', e.message);
  }
});

// /chatid - guruhda ID ni ko'rsatish
bot.command('chatid', async (ctx) => {
  const id = ctx.chat.id;
  const type = ctx.chat.type;
  await ctx.reply('Chat ID: `' + id + '`\nTur: ' + type, { parse_mode: 'Markdown' });
  console.log('chatid so\'rovi:', id, type);
});

bot.use(session());
bot.use(stage.middleware());

// Foydalanuvchini ro'yxatga olish va bloklanganlikni tekshirish
bot.use(async (ctx, next) => {
  // Guruh xabarlarini o'tkazib yuborish (faqat shaxsiy chat)
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

// /start
bot.command('start', async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  if (ctx.session) {
    ctx.session.surveyData = {};
    ctx.session.state = null;
  }
  return ctx.scene.enter(SURVEY_SCENE);
});

// /til
bot.command(['til', 'language'], async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  const lang = (ctx.session && ctx.session.lang) || dbApi.getUserLanguage(ctx.from.id) || 'uz';
  await ctx.reply(t(lang, 'chooseLanguage'), kb.languageInline());
});

// Til tanlash callback (scene tashqarisida)
bot.action(/^lang_(uz|ru)$/, async (ctx) => {
  const newLang = ctx.match[1];
  if (ctx.session) ctx.session.lang = newLang;
  dbApi.setUserLanguage(ctx.from.id, newLang);
  await ctx.answerCbQuery(newLang === 'uz' ? "O'zbek tili tanlandi" : 'Выбран русский язык');
  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (e) { /* ignore */ }
  const msg = newLang === 'uz'
    ? "Til o'zgartirildi. Boshlash uchun /start"
    : 'Язык изменён. Для начала /start';
  await ctx.reply(msg);
});

// /admin
bot.command('admin', async (ctx) => {
  if (ctx.chat.type !== 'private') return;
  if (!dbApi.isAdmin(ctx.from.id)) {
    return ctx.reply("Sizda admin huquqlari yo'q.");
  }
  return ctx.scene.enter(ADMIN_SCENE);
});

// /myid
bot.command('myid', async (ctx) => {
  await ctx.reply('Sizning Telegram ID: `' + ctx.from.id + '`', { parse_mode: 'Markdown' });
});

// /help
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
      } catch (e) {
        console.error('setMyCommands(admin ' + a.telegram_id + ') xato:', e.message);
      }
    }
  } catch (e) {
    console.error('setMyCommands xato:', e.message);
  }
}

bot.launch().then(async () => {
  await setBotCommands();
  console.log('Bot ishga tushdi!');
  console.log('Guruh ID:', dbApi.getSetting('group_id') || process.env.GROUP_ID);
  console.log('Super Admin:', process.env.SUPER_ADMIN_ID);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
