const { Scenes } = require('telegraf');
const { t } = require('../locales');
const { dbApi } = require('../database');
const kb = require('../keyboards');

const SURVEY_SCENE = 'survey';

const S = {
  PICK_LANG: 'pick_lang',
  ASK_NAME: 'ask_name',
  ASK_DEST: 'ask_dest',
  ASK_DATE: 'ask_date',
  ASK_PEOPLE: 'ask_people',
  ASK_CHILDREN: 'ask_children',
  ASK_CHILDREN_COUNT: 'ask_children_count',
  ASK_CHILDREN_AGES: 'ask_children_ages',
  ASK_TIME: 'ask_time',
  ASK_PHONE: 'ask_phone',
};

// ============ AQLLI VALIDATSIYA ============

// Unli harflar — haqiqiy so'zda bo'lishi shart
const VOWELS = 'aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯ';

function hasVowel(text) {
  for (const ch of text) {
    if (VOWELS.includes(ch)) return true;
  }
  return false;
}

// Ism: kamida 3 harf, unli bor, faqat harflar
function isValidName(text) {
  if (text.length < 3 || text.length > 100) return false;
  // Faqat harflar, bo'shliq, apostrof, tire
  if (!/^[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚʻ'`\s\-\.]+$/.test(text)) return false;
  const letters = text.match(/[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚ]/g);
  if (!letters || letters.length < 3) return false;
  // Haqiqiy so'zda unli bor
  if (!hasVowel(text)) return false;
  // 4 va undan ortiq bir xil harf ketma-ket bo'lmasin (masalan: "aaaa")
  if (/(.)\1{3,}/.test(text)) return false;
  return true;
}

// Yo'nalish: kamida 3 harf, unli bor
function isValidDestination(text) {
  if (text.length < 3 || text.length > 100) return false;
  if (!/^[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚʻ'`\s\-,\.]+$/.test(text)) return false;
  const letters = text.match(/[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚ]/g);
  if (!letters || letters.length < 3) return false;
  if (!hasVowel(text)) return false;
  if (/(.)\1{3,}/.test(text)) return false;
  return true;
}

// Sana: aniq formatlar
function isValidDate(text) {
  if (text.length < 3 || text.length > 50) return false;
  const cleaned = text.trim().toLowerCase();

  // DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY
  if (/^\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}$/.test(cleaned)) return true;

  // DD month_name (oy nomi bilan)
  const monthsUz = 'yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentyabr|oktyabr|noyabr|dekabr';
  const monthsRu = 'январ|феврал|март|апрел|мая|май|июн|июл|август|сентябр|октябр|ноябр|декабр';
  const monthRe = new RegExp(`^\\d{1,2}[\\s\\-]*(${monthsUz}|${monthsRu})`, 'i');
  if (monthRe.test(cleaned)) return true;

  // Month_name DD (masalan: "August 19" yoki "19 август")
  const monthFirstRe = new RegExp(`^(${monthsUz}|${monthsRu})[\\s\\-]*\\d{1,2}`, 'i');
  if (monthFirstRe.test(cleaned)) return true;

  // DD-DD month (oraliq: 19-25 avgust)
  const rangeRe = new RegExp(`^\\d{1,2}\\s*-\\s*\\d{1,2}[\\s\\-]*(${monthsUz}|${monthsRu})`, 'i');
  if (rangeRe.test(cleaned)) return true;

  return false;
}

// Son tekshirish (min-max oralig'ida)
function isValidNumber(text, min, max) {
  if (!/^\d+$/.test(text.trim())) return false;
  const num = parseInt(text.trim());
  return num >= (min || 1) && num <= (max || 999);
}

// Yoshlar: kerakli son va to'g'ri qiymatlar
function parseAges(text) {
  // Faqat raqamlar, vergul, bo'shliq, nuqta vergul
  if (!/^[\d,;\s]+$/.test(text)) return null;
  const parts = text.split(/[,;\s]+/).filter(x => x.length > 0);
  const ages = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = parseInt(p);
    if (isNaN(n) || n < 0 || n > 100) return null;
    ages.push(n);
  }
  if (ages.length === 0) return null;
  return ages;
}

const survey = new Scenes.BaseScene(SURVEY_SCENE);

survey.enter(async (ctx) => {
  ctx.session.surveyData = {};
  ctx.session.state = S.PICK_LANG;
  await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
});

async function promptState(ctx, state) {
  const lang = ctx.session.lang || 'uz';
  ctx.session.state = state;

  switch (state) {
    case S.PICK_LANG:
      await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
      break;
    case S.ASK_NAME:
      await ctx.reply(t(lang, 'askName'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_DEST:
      await ctx.reply(t(lang, 'askDestination'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_DATE:
      await ctx.reply(t(lang, 'askDate'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_PEOPLE:
      await ctx.reply(t(lang, 'askPeople'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_CHILDREN:
      await ctx.reply(t(lang, 'askChildren'), kb.yesNoInline(lang));
      break;
    case S.ASK_CHILDREN_COUNT:
      await ctx.reply(t(lang, 'askChildrenCount'));
      break;
    case S.ASK_CHILDREN_AGES:
      await ctx.reply(t(lang, 'askChildrenAges'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_TIME:
      await ctx.reply(t(lang, 'askContactTime'), kb.contactTimesInline(lang));
      break;
    case S.ASK_PHONE:
      await ctx.reply(t(lang, 'askPhone'), kb.phoneReply(lang));
      break;
  }
}

// ============ KOMANDALAR ============
survey.command('start', async (ctx) => {
  await ctx.scene.leave();
  return ctx.scene.enter(SURVEY_SCENE);
});

survey.command(['til', 'language'], async (ctx) => {
  const lang = ctx.session.lang || 'uz';
  await ctx.reply(t(lang, 'chooseLanguage'), kb.languageInline());
});

survey.command('admin', async (ctx) => {
  if (!dbApi.isAdmin(ctx.from.id)) {
    return ctx.reply("❌ Sizda admin huquqlari yo'q.");
  }
  await ctx.scene.leave();
  return ctx.scene.enter('admin');
});

survey.command('myid', async (ctx) => {
  await ctx.reply('Sizning Telegram ID: `' + ctx.from.id + '`', { parse_mode: 'Markdown' });
});

survey.command('help', async (ctx) => {
  const isAdmin = dbApi.isAdmin(ctx.from.id);
  let msg = "/start - Boshlash\n/til - Tilni o'zgartirish\n/myid - Telegram ID";
  if (isAdmin) msg += '\n/admin - Admin panel';
  await ctx.reply(msg);
});

survey.command('chatid', async (ctx) => {
  await ctx.reply('Chat ID: `' + ctx.chat.id + '`', { parse_mode: 'Markdown' });
});

// ============ TIL ============
survey.action(/^lang_(uz|ru)$/, async (ctx) => {
  const newLang = ctx.match[1];
  const wasFirstTime = ctx.session.state === S.PICK_LANG;
  ctx.session.lang = newLang;
  dbApi.setUserLanguage(ctx.from.id, newLang);
  await ctx.answerCbQuery(newLang === 'uz' ? "✅ O'zbek tili" : '✅ Русский язык');

  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (e) { /* ignore */ }

  if (wasFirstTime) {
    await ctx.reply(t(newLang, 'welcome'));
    await promptState(ctx, S.ASK_NAME);
  } else {
    await promptState(ctx, ctx.session.state);
  }
});

survey.action(/^children_(yes|no)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_CHILDREN) {
    return ctx.answerCbQuery();
  }
  const hasChildren = ctx.match[1] === 'yes';
  ctx.session.surveyData.has_children = hasChildren;
  await ctx.answerCbQuery();

  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (e) { /* ignore */ }

  if (hasChildren) {
    await promptState(ctx, S.ASK_CHILDREN_COUNT);
  } else {
    await promptState(ctx, S.ASK_TIME);
  }
});

survey.action(/^time_(\d+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_TIME) {
    return ctx.answerCbQuery();
  }
  const id = parseInt(ctx.match[1]);
  const times = dbApi.getContactTimes();
  const time = times.find(x => x.id === id);
  if (!time) {
    return ctx.answerCbQuery('❌');
  }
  ctx.session.surveyData.contact_time = time.label;
  await ctx.answerCbQuery('✅ ' + time.label);

  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (e) { /* ignore */ }

  await promptState(ctx, S.ASK_PHONE);
});

survey.on('contact', async (ctx) => {
  if (ctx.session.state !== S.ASK_PHONE) return;
  const phone = ctx.message.contact.phone_number;
  ctx.session.surveyData.phone = phone;
  await finishSurvey(ctx);
});

survey.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  const lang = ctx.session.lang || 'uz';
  const state = ctx.session.state;

  if (text.startsWith('/')) return;

  switch (state) {
    case S.PICK_LANG:
      await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
      break;

    case S.ASK_NAME:
      if (!isValidName(text)) {
        await ctx.reply(t(lang, 'invalidName'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.full_name = text;
      await promptState(ctx, S.ASK_DEST);
      break;

    case S.ASK_DEST:
      if (!isValidDestination(text)) {
        await ctx.reply(t(lang, 'invalidDestination'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.destination = text;
      await promptState(ctx, S.ASK_DATE);
      break;

    case S.ASK_DATE:
      if (!isValidDate(text)) {
        await ctx.reply(t(lang, 'invalidDate'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.travel_date = text;
      await promptState(ctx, S.ASK_PEOPLE);
      break;

    case S.ASK_PEOPLE:
      if (!isValidNumber(text, 1, 50)) {
        await ctx.reply(t(lang, 'invalidPeople'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.people_count = text;
      await promptState(ctx, S.ASK_CHILDREN);
      break;

    case S.ASK_CHILDREN:
      await ctx.reply(t(lang, 'askChildren'), kb.yesNoInline(lang));
      break;

    case S.ASK_CHILDREN_COUNT: {
      if (!isValidNumber(text, 1, 50)) {
        await ctx.reply(t(lang, 'invalidChildrenCount'), { parse_mode: 'Markdown' });
        return;
      }
      const childrenCount = parseInt(text);
      const peopleCount = parseInt(ctx.session.surveyData.people_count) || 0;
      // Bolalar soni umumiy odam sonidan kam bo'lishi kerak (kamida 1 ta katta odam kerak)
      if (childrenCount >= peopleCount) {
        const msg = t(lang, 'invalidChildrenMath')
          .replace('{p}', peopleCount)
          .replace('{c}', childrenCount);
        await ctx.reply(msg);
        return;
      }
      ctx.session.surveyData.children_count = text;
      await promptState(ctx, S.ASK_CHILDREN_AGES);
      break;
    }

    case S.ASK_CHILDREN_AGES: {
      const ages = parseAges(text);
      if (!ages) {
        await ctx.reply(t(lang, 'invalidAges'), { parse_mode: 'Markdown' });
        return;
      }
      const expectedCount = parseInt(ctx.session.surveyData.children_count) || 0;
      if (ages.length !== expectedCount) {
        const msg = t(lang, 'invalidAgesCount')
          .replace('{n}', expectedCount)
          .replace('{a}', ages.length);
        await ctx.reply(msg, { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.children_ages = ages.join(', ');
      await promptState(ctx, S.ASK_TIME);
      break;
    }

    case S.ASK_TIME:
      await ctx.reply(t(lang, 'askContactTime'), kb.contactTimesInline(lang));
      break;

    case S.ASK_PHONE: {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        await ctx.reply(t(lang, 'invalidPhone'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.phone = text;
      await finishSurvey(ctx);
      break;
    }

    default:
      await ctx.scene.leave();
      await ctx.scene.enter(SURVEY_SCENE);
  }
});

async function finishSurvey(ctx) {
  const lang = ctx.session.lang || 'uz';
  ctx.session.surveyData.telegram_id = ctx.from.id;
  ctx.session.surveyData.language = lang;

  try {
    dbApi.saveSurvey(ctx.session.surveyData);
  } catch (e) {
    console.error('DB saqlashda xato:', e);
  }

  await sendToGroup(ctx, ctx.session.surveyData);
  await ctx.reply(t(lang, 'finish'), kb.removeReply());
  return ctx.scene.leave();
}

async function sendToGroup(ctx, data) {
  const lang = data.language;
  const groupId = dbApi.getSetting('group_id') || process.env.GROUP_ID;
  if (!groupId) {
    console.error('GROUP_ID belgilanmagan!');
    return;
  }

  const childrenText = data.has_children
    ? `${t(lang, 'g_childrenYes')} (${data.children_count}, ${t(lang, 'g_childrenAges')}: ${data.children_ages})`
    : t(lang, 'g_childrenNo');

  const username = ctx.from.username ? `@${ctx.from.username}` : '—';

  const message =
    `${t(lang, 'g_newRequest')}\n\n` +
    `${t(lang, 'g_name')}: ${data.full_name}\n` +
    `${t(lang, 'g_destination')}: ${data.destination}\n` +
    `${t(lang, 'g_date')}: ${data.travel_date}\n` +
    `${t(lang, 'g_people')}: ${data.people_count}\n` +
    `${t(lang, 'g_children')}: ${childrenText}\n` +
    `${t(lang, 'g_contactTime')}: ${data.contact_time}\n` +
    `${t(lang, 'g_phone')}: ${data.phone}\n` +
    `${t(lang, 'g_username')}: ${username}`;

  try {
    await ctx.telegram.sendMessage(groupId, message);
    console.log('OK - Guruhga yuborildi: ' + groupId);
    return;
  } catch (err) {
    console.error('XATO - Guruhga (' + groupId + ') yuborib bo\'lmadi: ' + err.message);

    if (!String(groupId).startsWith('-100')) {
      const altId = '-100' + String(groupId).replace(/^-/, '');
      try {
        await ctx.telegram.sendMessage(altId, message);
        dbApi.setSetting('group_id', altId);
        console.log('OK - Yangi ID bilan: ' + altId);
        return;
      } catch (err2) { /* ignore */ }
    }

    try {
      const superAdminId = process.env.SUPER_ADMIN_ID;
      if (superAdminId) {
        await ctx.telegram.sendMessage(
          superAdminId,
          'Guruhga xabar yuborib bo\'lmadi!\nGuruh ID: ' + groupId + '\nXato: ' + err.message
        );
      }
    } catch (e) { /* ignore */ }
  }
}

module.exports = { survey, SURVEY_SCENE };
