const { dbApi } = require('./database');

const defaultLocales = {
  uz: {
    chooseLanguage: "🌐 Tilni tanlang / Выберите язык:",
    welcome: "Assalomu alaykum! 👋\n\n\"Riva Tour\" botiga xush kelibsiz.\n\nSizga eng yaxshi sayohatni tashkil etish uchun bir necha savol beramiz.",
    askName: "👤 Ism va familiyangizni kiriting:",
    askDestination: "📍 Qayerga uchmoqchisiz?\n_Masalan: Dubay, Arabiston_",
    askDate: "📅 Qachon uchmoqchisiz?\n_Masalan: 19-avgust yoki 20.08.2026_",
    askPeople: "👥 Necha kishi?",
    askChildren: "👶 Bolalar bormi?",
    askChildrenCount: "Bolalar nechta?",
    askChildrenAges: "Bolalarning yoshlarini kiriting:\n_Masalan: 3, 5 yoki 3 5_",
    askContactTime: "📞 Qachon telefon qilish mumkin?",
    askPhone: "📱 Telefon raqamingizni kiriting yoki pastdagi tugmani bosing:",
    finish: "✅ Rahmat! Menejerlarimiz tez orada siz bilan bog'lanishadi.",
    yes: "Ha",
    no: "Yo'q",
    sharePhone: "📱 Telefon raqamini yuborish",
    changeLanguage: "🌐 Til / Язык",
    invalidPhone: "❌ Telefon raqamini to'g'ri kiriting yoki tugmani bosing.",
    invalidName: "❌ Iltimos, ism familiyangizni to'g'ri kiriting (faqat harflar).",
    invalidNumber: "❌ Iltimos, son kiriting (faqat raqamlar).",
    invalidAges: "❌ Iltimos, yoshlarni son ko'rinishida kiriting.\n_Masalan: 3, 5 yoki 3 5_",
    blocked: "❌ Siz bloklangansiz.",
    botInactive: "Bot vaqtincha ishlamayapti. Iltimos, keyinroq urinib ko'ring.",
    g_name: "👤 Ismi",
    g_destination: "📍 Yo'nalish",
    g_date: "📅 Sana",
    g_people: "👥 Odam soni",
    g_children: "👶 Bolalar",
    g_childrenYes: "Bor",
    g_childrenNo: "Yo'q",
    g_childrenAges: "yoshlari",
    g_contactTime: "📞 Bog'lanish vaqti",
    g_phone: "📱 Telefon",
    g_username: "👨‍💻 Username",
    g_newRequest: "🆕 YANGI SO'ROV",
  },
  ru: {
    chooseLanguage: "🌐 Tilni tanlang / Выберите язык:",
    welcome: "Здравствуйте! 👋\n\nДобро пожаловать в бот \"Riva Tour\".\n\nМы зададим несколько вопросов, чтобы организовать для вас лучшее путешествие.",
    askName: "👤 Введите ваше имя и фамилию:",
    askDestination: "📍 Куда хотите полететь?\n_Например: Дубай, Аравия_",
    askDate: "📅 Когда хотите полететь?\n_Например: 19 августа или 20.08.2026_",
    askPeople: "👥 Сколько человек?",
    askChildren: "👶 Есть ли дети?",
    askChildrenCount: "Сколько детей?",
    askChildrenAges: "Введите возраст детей:\n_Например: 3, 5 или 3 5_",
    askContactTime: "📞 Когда удобно позвонить?",
    askPhone: "📱 Введите ваш номер телефона или нажмите кнопку ниже:",
    finish: "✅ Спасибо! Наши менеджеры свяжутся с вами в ближайшее время.",
    yes: "Да",
    no: "Нет",
    sharePhone: "📱 Отправить номер телефона",
    changeLanguage: "🌐 Til / Язык",
    invalidPhone: "❌ Введите номер телефона правильно или нажмите кнопку.",
    invalidName: "❌ Пожалуйста, введите имя и фамилию правильно (только буквы).",
    invalidNumber: "❌ Пожалуйста, введите число (только цифры).",
    invalidAges: "❌ Пожалуйста, введите возраст числами.\n_Например: 3, 5 или 3 5_",
    blocked: "❌ Вы заблокированы.",
    botInactive: "Бот временно не работает. Пожалуйста, попробуйте позже.",
    g_name: "👤 Имя",
    g_destination: "📍 Направление",
    g_date: "📅 Дата",
    g_people: "👥 Количество человек",
    g_children: "👶 Дети",
    g_childrenYes: "Есть",
    g_childrenNo: "Нет",
    g_childrenAges: "возраст",
    g_contactTime: "📞 Время для связи",
    g_phone: "📱 Телефон",
    g_username: "👨‍💻 Username",
    g_newRequest: "🆕 НОВАЯ ЗАЯВКА",
  }
};

function t(lang, key) {
  const override = dbApi.getTextOverride(lang, key);
  if (override !== null) return override;
  const l = defaultLocales[lang] || defaultLocales.uz;
  return l[key] || defaultLocales.uz[key] || key;
}

function getAllKeys() {
  return Object.keys(defaultLocales.uz);
}

function getDefault(lang, key) {
  return (defaultLocales[lang] || defaultLocales.uz)[key] || '';
}

module.exports = { t, getAllKeys, getDefault, defaultLocales };
