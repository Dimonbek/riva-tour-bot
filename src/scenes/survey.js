const { Scenes } = require('telegraf');
const { t } = require('../locales');
const { dbApi } = require('../database');
const kb = require('../keyboards');

const SURVEY_SCENE = 'survey';

const S = {
  PICK_LANG: 'pick_lang',
  ASK_PHONE: 'ask_phone',
  ASK_DEST: 'ask_dest',
  ASK_CUSTOM_DEST: 'ask_custom_dest',
  ASK_DATE: 'ask_date',
  ASK_PEOPLE: 'ask_people',
  ASK_PEOPLE_CUSTOM: 'ask_people_custom',
  ASK_CHILDREN: 'ask_children',
  ASK_CHILDREN_COUNT: 'ask_children_count',
  ASK_CHILD_AGE: 'ask_child_age',
  ASK_TIME: 'ask_time',
};

function previousState(state, hasChildren) {
  switch (state) {
    case S.ASK_PHONE: return null;
    case S.ASK_DEST: return S.ASK_PHONE;
    case S.ASK_CUSTOM_DEST: return S.ASK_DEST;
    case S.ASK_DATE: return S.ASK_DEST;
    case S.ASK_PEOPLE: return S.ASK_DATE;
    case S.ASK_PEOPLE_CUSTOM: return S.ASK_PEOPLE;
    case S.ASK_CHILDREN: return S.ASK_PEOPLE;
    case S.ASK_CHILDREN_COUNT: return S.ASK_CHILDREN;
    case S.ASK_CHILD_AGE: return S.ASK_CHILDREN_COUNT;
    case S.ASK_TIME: return hasChildren ? S.ASK_CHILD_AGE : S.ASK_CHILDREN;
    default: return null;
  }
}

function isValidDestination(text) {
  if (text.length < 3 || text.length > 100) return false;
  if (!/^[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚʻ'`\s\-,\.]+$/.test(text)) return false;
  const letters = text.match(/[a-zA-ZА-Яа-яЁёўғҳқЎҒҲҚ]/g);
  if (!letters || letters.length < 3) return false;
  const VOWELS = 'aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯ';
  let has = false;
  for (const ch of text) if (VOWELS.includes(ch)) { has = true; break; }
  if (!has) return false;
  if (/(.)\1{3,}/.test(text)) return false;
  return true;
}

function isValidNumber(text, min, max) {
  if (!/^\d+$/.test(text.trim())) return false;
  const num = parseInt(text.trim());
  return num >= (min || 1) && num <= (max || 999);
}

// O'chirish funksiyalari (no-op) — tezlik uchun olib tashlandi
function deletePrevBot(ctx) { /* no-op */ }
function trackMsg(ctx, msg) { /* no-op */ }
function tryDeleteUserMsg(ctx) { /* no-op */ }

const survey = new Scenes.BaseScene(SURVEY_SCENE);

survey.enter(async (ctx) => {
  ctx.session.surveyData = {};
  ctx.session.state = S.PICK_LANG;
  ctx.session.botMsgIds = [];
  const sent = await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
  trackMsg(ctx, sent);
});

async function promptState(ctx, state) {
  deletePrevBot(ctx); // Fonda, kutilmaydi — TEZ
  const lang = ctx.session.lang || 'uz';
  ctx.session.state = state;
  const opts = { parse_mode: 'Markdown' };
  let sent;
  switch (state) {
    case S.PICK_LANG:
      sent = await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
      break;
    case S.ASK_PHONE:
      sent = await ctx.reply(t(lang, 'askPhone'), kb.phoneReply(lang));
      break;
    case S.ASK_DEST:
      sent = await ctx.reply(t(lang, 'askDestination'), { ...opts, ...kb.destinationsInline(lang) });
      break;
    case S.ASK_CUSTOM_DEST:
      sent = await ctx.reply(t(lang, 'askCustomDestination'), { ...opts, ...kb.backInline(lang) });
      break;
    case S.ASK_DATE:
      sent = await ctx.reply(t(lang, 'askDate'), kb.datesInline(lang));
      break;
    case S.ASK_PEOPLE:
      sent = await ctx.reply(t(lang, 'askPeople'), kb.peopleInline(lang));
      break;
    case S.ASK_PEOPLE_CUSTOM:
      sent = await ctx.reply(t(lang, 'askPeopleCustom'), kb.backInline(lang));
      break;
    case S.ASK_CHILDREN:
      sent = await ctx.reply(t(lang, 'askChildren'), kb.yesNoInline(lang));
      break;
    case S.ASK_CHILDREN_COUNT:
      sent = await ctx.reply(t(lang, 'askChildrenCount'), kb.childrenCountInline(lang));
      break;
    case S.ASK_CHILD_AGE: {
      const idx = ctx.session.currentChild || 1;
      const total = parseInt(ctx.session.surveyData.children_count) || 0;
      const msg = t(lang, 'askChildAge').replace(/\{n\}/g, idx).replace('{total}', total);
      sent = await ctx.reply(msg, kb.childAgeInline(lang));
      break;
    }
    case S.ASK_TIME:
      sent = await ctx.reply(t(lang, 'askContactTime'), kb.contactTimesInline(lang));
      break;
  }
  trackMsg(ctx, sent);
}

survey.command('start', async (ctx) => {
  await ctx.scene.leave();
  return ctx.scene.enter(SURVEY_SCENE);
});

survey.command(['til', 'language'], async (ctx) => {
  const lang = ctx.session.lang || 'uz';
  await ctx.reply(t(lang, 'chooseLanguage'), kb.languageInline());
});

survey.command('admin', async (ctx) => {
  if (!dbApi.isAdmin(ctx.from.id)) return ctx.reply("Sizda admin huquqlari yo'q.");
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

survey.action(/^lang_(uz|ru)$/, async (ctx) => {
  const newLang = ctx.match[1];
  const wasFirstTime = ctx.session.state === S.PICK_LANG;
  ctx.session.lang = newLang;
  dbApi.setUserLanguage(ctx.from.id, newLang);
  await ctx.answerCbQuery(newLang === 'uz' ? "✅ O'zbek tili" : '✅ Русский язык');
  if (wasFirstTime) {
    await promptState(ctx, S.ASK_PHONE);
  } else {
    await promptState(ctx, ctx.session.state);
  }
});

survey.action('back', async (ctx) => {
  await ctx.answerCbQuery();
  const hasChildren = ctx.session.surveyData && ctx.session.surveyData.has_children;
  const currentState = ctx.session.state;
  const prev = previousState(currentState, hasChildren);
  if (!prev) return;
  const data = ctx.session.surveyData || {};
  if (currentState === S.ASK_DEST || currentState === S.ASK_CUSTOM_DEST) {
    delete data.destination;
  } else if (currentState === S.ASK_DATE) {
    delete data.travel_date;
  } else if (currentState === S.ASK_PEOPLE || currentState === S.ASK_PEOPLE_CUSTOM) {
    delete data.people_count;
  } else if (currentState === S.ASK_CHILDREN) {
    delete data.has_children;
  } else if (currentState === S.ASK_CHILDREN_COUNT) {
    delete data.children_count;
  } else if (currentState === S.ASK_CHILD_AGE) {
    if (ctx.session.currentChild && ctx.session.currentChild > 1) {
      ctx.session.currentChild--;
      if (ctx.session.childAges) ctx.session.childAges.pop();
      await promptState(ctx, S.ASK_CHILD_AGE);
      return;
    } else {
      delete data.children_count;
      ctx.session.currentChild = 0;
      ctx.session.childAges = [];
    }
  } else if (currentState === S.ASK_TIME) {
    delete data.contact_time;
  }
  await promptState(ctx, prev);
});

survey.action(/^dest:(.+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_DEST) return ctx.answerCbQuery();
  const val = ctx.match[1];
  await ctx.answerCbQuery();
  if (val === 'other') return promptState(ctx, S.ASK_CUSTOM_DEST);
  const tour = kb.TOURS[parseInt(val)];
  if (!tour) return;
  ctx.session.surveyData.destination = tour;
  await promptState(ctx, S.ASK_DATE);
});

survey.action(/^date:(.+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_DATE) return ctx.answerCbQuery();
  const lang = ctx.session.lang || 'uz';
  const option = kb.DATE_OPTIONS.find(o => o.key === ctx.match[1]);
  if (!option) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  ctx.session.surveyData.travel_date = t(lang, option.tKey);
  await promptState(ctx, S.ASK_PEOPLE);
});

survey.action(/^people:(.+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_PEOPLE) return ctx.answerCbQuery();
  const val = ctx.match[1];
  const lang = ctx.session.lang || 'uz';
  await ctx.answerCbQuery();
  if (val === 'more') return promptState(ctx, S.ASK_PEOPLE_CUSTOM);
  if (val === 'partner') {
    ctx.session.surveyData.people_count = '1 (' + t(lang, 'peoplePartner') + ')';
  } else {
    ctx.session.surveyData.people_count = val;
  }
  await promptState(ctx, S.ASK_CHILDREN);
});

survey.action(/^children_(yes|no)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_CHILDREN) return ctx.answerCbQuery();
  const hasChildren = ctx.match[1] === 'yes';
  await ctx.answerCbQuery();
  const peopleCount = parseInt(ctx.session.surveyData.people_count) || 0;
  if (hasChildren && peopleCount <= 1) {
    const lang = ctx.session.lang || 'uz';
    await ctx.reply(lang === 'uz'
      ? "❌ Bolalar bo'lsa, kamida 2 kishi bo'lishi kerak."
      : '❌ Если есть дети, нужно минимум 2 человека.');
    await promptState(ctx, S.ASK_CHILDREN);
    return;
  }
  ctx.session.surveyData.has_children = hasChildren;
  if (hasChildren) await promptState(ctx, S.ASK_CHILDREN_COUNT);
  else await promptState(ctx, S.ASK_TIME);
});

survey.action(/^cc:(\d+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_CHILDREN_COUNT) return ctx.answerCbQuery();
  const cnt = parseInt(ctx.match[1]);
  const peopleCount = parseInt(ctx.session.surveyData.people_count) || 0;
  const lang = ctx.session.lang || 'uz';
  if (cnt >= peopleCount) {
    await ctx.answerCbQuery();
    const msg = t(lang, 'invalidChildrenMath').replace('{p}', peopleCount).replace('{c}', cnt);
    await ctx.reply(msg);
    return;
  }
  await ctx.answerCbQuery();
  ctx.session.surveyData.children_count = String(cnt);
  ctx.session.currentChild = 1;
  ctx.session.childAges = [];
  await promptState(ctx, S.ASK_CHILD_AGE);
});

survey.action(/^age:(.+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_CHILD_AGE) return ctx.answerCbQuery();
  const lang = ctx.session.lang || 'uz';
  const option = kb.AGE_OPTIONS.find(o => o.key === ctx.match[1]);
  if (!option) return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  if (!ctx.session.childAges) ctx.session.childAges = [];
  ctx.session.childAges.push(t(lang, option.tKey));
  const total = parseInt(ctx.session.surveyData.children_count) || 0;
  if (ctx.session.currentChild >= total) {
    ctx.session.surveyData.children_ages = ctx.session.childAges.join(', ');
    await promptState(ctx, S.ASK_TIME);
  } else {
    ctx.session.currentChild++;
    await promptState(ctx, S.ASK_CHILD_AGE);
  }
});

survey.action(/^time_(\d+)$/, async (ctx) => {
  if (ctx.session.state !== S.ASK_TIME) return ctx.answerCbQuery();
  const id = parseInt(ctx.match[1]);
  const times = dbApi.getContactTimes();
  const time = times.find(x => x.id === id);
  if (!time) return ctx.answerCbQuery('❌');
  ctx.session.surveyData.contact_time = time.label;
  await ctx.answerCbQuery('✅ ' + time.label);
  await deletePrevBot(ctx);
  await finishSurvey(ctx);
});

survey.on('contact', async (ctx) => {
  if (ctx.session.state !== S.ASK_PHONE) return;
  ctx.session.surveyData.phone = ctx.message.contact.phone_number;
  await tryDeleteUserMsg(ctx);
  // Reply keyboard ni olib tashlash uchun bir martalik xabar
  try {
    const removeMsg = await ctx.reply('✅', kb.removeReply());
    try { await ctx.telegram.deleteMessage(ctx.chat.id, removeMsg.message_id); } catch (e) {}
  } catch (e) {}
  await promptState(ctx, S.ASK_DEST);
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
    case S.ASK_PHONE: {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        await ctx.reply(t(lang, 'invalidPhone'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.phone = text;
      await tryDeleteUserMsg(ctx);
      try {
        const removeMsg = await ctx.reply('✅', kb.removeReply());
        try { await ctx.telegram.deleteMessage(ctx.chat.id, removeMsg.message_id); } catch (e) {}
      } catch (e) {}
      await promptState(ctx, S.ASK_DEST);
      break;
    }
    case S.ASK_DEST:
      await promptState(ctx, S.ASK_DEST);
      break;
    case S.ASK_CUSTOM_DEST:
      if (!isValidDestination(text)) {
        await ctx.reply(t(lang, 'invalidDestination'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.destination = text;
      await tryDeleteUserMsg(ctx);
      await promptState(ctx, S.ASK_DATE);
      break;
    case S.ASK_DATE:
      await promptState(ctx, S.ASK_DATE);
      break;
    case S.ASK_PEOPLE:
      await promptState(ctx, S.ASK_PEOPLE);
      break;
    case S.ASK_PEOPLE_CUSTOM:
      if (!isValidNumber(text, 1, 50)) {
        await ctx.reply(t(lang, 'invalidPeople'), { parse_mode: 'Markdown' });
        return;
      }
      ctx.session.surveyData.people_count = text;
      await tryDeleteUserMsg(ctx);
      await promptState(ctx, S.ASK_CHILDREN);
      break;
    case S.ASK_CHILDREN:
      await promptState(ctx, S.ASK_CHILDREN);
      break;
    case S.ASK_CHILDREN_COUNT:
      await promptState(ctx, S.ASK_CHILDREN_COUNT);
      break;
    case S.ASK_CHILD_AGE:
      await promptState(ctx, S.ASK_CHILD_AGE);
      break;
    case S.ASK_TIME:
      await promptState(ctx, S.ASK_TIME);
      break;
    default:
      await ctx.scene.leave();
      await ctx.scene.enter(SURVEY_SCENE);
  }
});

async function finishSurvey(ctx) {
  const lang = ctx.session.lang || 'uz';
  ctx.session.surveyData.telegram_id = ctx.from.id;
  ctx.session.surveyData.language = lang;
  const manager = dbApi.getNextManager();
  ctx.session.surveyData.manager = manager;
  try { dbApi.saveSurvey(ctx.session.surveyData); } catch (e) { console.error('DB:', e); }
  await sendToGroup(ctx, ctx.session.surveyData);
  await ctx.reply(t(lang, 'finish'), kb.removeReply());
  return ctx.scene.leave();
}

async function sendToGroup(ctx, data) {
  const lang = data.language;
  const groupId = dbApi.getSetting('group_id') || process.env.GROUP_ID;
  if (!groupId) return;
  const childrenText = data.has_children
    ? `${t(lang, 'g_childrenYes')} (${data.children_count}, ${t(lang, 'g_childrenAges')}: ${data.children_ages})`
    : t(lang, 'g_childrenNo');
  const username = ctx.from.username ? '@' + ctx.from.username : '—';
  const userInfo = ctx.from.first_name || username;
  let message =
    t(lang, 'g_newRequest') + '\n\n' +
    t(lang, 'g_destination') + ': ' + data.destination + '\n' +
    t(lang, 'g_date') + ': ' + data.travel_date + '\n' +
    t(lang, 'g_people') + ': ' + data.people_count + '\n' +
    t(lang, 'g_children') + ': ' + childrenText + '\n' +
    t(lang, 'g_contactTime') + ': ' + data.contact_time + '\n' +
    t(lang, 'g_phone') + ': ' + data.phone + '\n' +
    t(lang, 'g_username') + ': ' + username + '\n' +
    '👤 ' + (lang === 'uz' ? 'Foydalanuvchi' : 'Пользователь') + ': ' + userInfo;
  if (data.manager) {
    message += '\n\n👨‍💼 ' + (lang === 'uz' ? 'Menejer' : 'Менеджер') + ': ' + data.manager;
  }

  try {
    await ctx.telegram.sendMessage(groupId, message);
    console.log('OK guruhga:', groupId);
    return;
  } catch (err) {
    console.error('Guruh xato (' + groupId + '):', err.message);
  }

  if (!String(groupId).startsWith('-100')) {
    const altId = '-100' + String(groupId).replace(/^-/, '');
    try {
      await ctx.telegram.sendMessage(altId, message);
      dbApi.setSetting('group_id', altId);
      console.log('OK guruhga (-100):', altId);
      return;
    } catch (e2) {
      console.error('Guruh xato (' + altId + '):', e2.message);
    }
  }

  try {
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (superAdminId) {
      await ctx.telegram.sendMessage(
        superAdminId,
        "⚠️ Guruhga xabar yuborib bo'lmadi!\n\nGuruh ID: " + groupId + "\n\nSo'rov ma'lumotlari:\n\n" + message
      );
    }
  } catch (e) {}
}

module.exports = { survey, SURVEY_SCENE };
