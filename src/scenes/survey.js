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
      await ctx.reply(t(lang, 'askName'));
      break;
    case S.ASK_DEST:
      await ctx.reply(t(lang, 'askDestination'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_DATE:
      await ctx.reply(t(lang, 'askDate'), { parse_mode: 'Markdown' });
      break;
    case S.ASK_PEOPLE:
      await ctx.reply(t(lang, 'askPeople'));
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

survey.command('start', async (ctx) => {
  await ctx.scene.leave();
  return ctx.scene.enter(SURVEY_SCENE);
});

survey.command(['til', 'language'], async (ctx) => {
  const lang = ctx.session.lang || 'uz';
  await ctx.reply(t(lang, 'chooseLanguage'), kb.languageInline());
});

survey.action(/^lang_(uz|ru)$/, async (ctx) => {
  const newLang = ctx.match[1];
  const wasFirstTime = ctx.session.state === S.PICK_LANG;
  ctx.session.lang = newLang;
  dbApi.setUserLanguage(ctx.from.id, newLang);
  await ctx.answerCbQuery(newLang === 'uz' ? "✅ O'zbek tili tanlandi" : '✅ Выбран русский язык');

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

  if (text === '/start' || text === '/til' || text === '/language') return;

  switch (state) {
    case S.PICK_LANG:
      await ctx.reply(t('uz', 'chooseLanguage'), kb.languageInline());
      break;

    case S.ASK_NAME:
      ctx.session.surveyData.full_name = text;
      await promptState(ctx, S.ASK_DEST);
      break;

    case S.ASK_DEST:
      ctx.session.surveyData.destination = text;
      await promptState(ctx, S.ASK_DATE);
      break;

    case S.ASK_DATE:
      ctx.session.surveyData.travel_date = text;
      await promptState(ctx, S.ASK_PEOPLE);
      break;

    case S.ASK_PEOPLE:
      ctx.session.surveyData.people_count = text;
      await promptState(ctx, S.ASK_CHILDREN);
      break;

    case S.ASK_CHILDREN:
      await ctx.reply(t(lang, 'askChildren'), kb.yesNoInline(lang));
      break;

    case S.ASK_CHILDREN_COUNT:
      ctx.session.surveyData.children_count = text;
      await promptState(ctx, S.ASK_CHILDREN_AGES);
      break;

    case S.ASK_CHILDREN_AGES:
      ctx.session.surveyData.children_ages = text;
      await promptState(ctx, S.ASK_TIME);
      break;

    case S.ASK_TIME:
      await ctx.reply(t(lang, 'askContactTime'), kb.contactTimesInline(lang));
      break;

    case S.ASK_PHONE: {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7) {
        await ctx.reply(t(lang, 'invalidPhone'));
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
        console.log('OK - Guruhga yuborildi (-100 prefix bilan): ' + altId);
        dbApi.setSetting('group_id', altId);
        console.log('Yangi guruh ID saqlandi: ' + altId);
        return;
      } catch (err2) {
        console.error('XATO - ' + altId + ' ga ham yuborib bo\'lmadi: ' + err2.message);
      }
    }

    try {
      const superAdminId = process.env.SUPER_ADMIN_ID;
      if (superAdminId) {
        await ctx.telegram.sendMessage(
          superAdminId,
          '⚠️ Guruhga xabar yuborib bo\'lmadi!\n\n' +
          'Guruh ID: ' + groupId + '\n' +
          'Xato: ' + err.message + '\n\n' +
          'Sabablar:\n' +
          '1. Bot guruhga qo\'shilmagan\n' +
          '2. Bot adminlik huquqi yo\'q\n' +
          '3. Guruh ID noto\'g\'ri (supergroup uchun -100 bilan boshlanishi kerak)'
        );
      }
    } catch (e) { /* ignore */ }
  }
}

module.exports = { survey, SURVEY_SCENE };
