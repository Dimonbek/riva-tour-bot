const { Markup } = require('telegraf');
const { t } = require('./locales');
const { dbApi } = require('./database');

function languageInline() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇿 O'zbek tili", 'lang_uz'),
      Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
    ]
  ]);
}

function yesNoInline(lang) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ ' + t(lang, 'yes'), 'children_yes'),
      Markup.button.callback('❌ ' + t(lang, 'no'), 'children_no'),
    ]
  ]);
}

function contactTimesInline(lang) {
  const times = dbApi.getContactTimes();
  const rows = [];
  for (let i = 0; i < times.length; i += 2) {
    const row = [Markup.button.callback('🕐 ' + times[i].label, `time_${times[i].id}`)];
    if (times[i + 1]) {
      row.push(Markup.button.callback('🕐 ' + times[i + 1].label, `time_${times[i + 1].id}`));
    }
    rows.push(row);
  }
  return Markup.inlineKeyboard(rows);
}

function phoneReply(lang) {
  return Markup.keyboard([
    [Markup.button.contactRequest(t(lang, 'sharePhone'))],
  ]).resize().oneTime();
}

function removeReply() {
  return Markup.removeKeyboard();
}

module.exports = {
  languageInline,
  yesNoInline,
  contactTimesInline,
  phoneReply,
  removeReply,
};
