const { dbApi } = require('./database');

const defaultLocales = {
  uz: {
    chooseLanguage: "🌐 Tilni tanlang / Выберите язык:",
    welcome: "Assalomu alaykum! 👋\n\n\"Riva Tour\" botiga xush kelibsiz.\n\nSizga eng yaxshi sayohatni tashkil etish uchun bir necha savol beramiz.",
    askName: "👤 Ism va familiyangizni kiriting:\n_Masalan: Akmal Karimov_",
    askDestination: "📍 Qayerga uchmoqchisiz?\n_Masalan: Dubay, Arabiston, Turkiya_",
    askDate: "📅 Qachon uchmoqchisiz?\n_Masalan: 19-avgust yoki 20.08.2026_",
    askPeople: "👥 Necha kishi?\n_1 dan 50 gacha_",
    askChildren: "👶 Bolalar bormi?",
    askChildrenCount: "👶 Bolalar nechta?",
    askChildrenAges: "🎂 Bolalarning yoshlarini kiriting:\n_Har bir bolaning yoshini vergul bilan ajrating._\n_Masalan: 3, 5, 7_",
    askContactTime: "📞 Qachon telefon qilish mumkin?",
    askPhone: "📱 Telefon raqamingizni kiriting yoki pastdagi tugmani bosing:",
    finish: "✅ Rahmat! Menejerlarimiz tez orada siz bilan bog'lanishadi.",
    yes: "Ha",
    no: "Yo'q",
    sharePhone: "📱 Telefon raqamini yuborish",
    changeLanguage: "🌐 Til / Язык",
    invalidPhone: "❌ Telefon raqamini to'g'ri kiriting yoki tugmani bosing.\n_Kamida 7 ta raqam._",
    invalidName: "❌ Iltimos, haqiqiy ism familiya kiriting.\n_Faqat harflar, kamida 3 ta belgi._\n_Masalan: Akmal Karimov_",
    invalidDestination: "❌ Iltimos, haqiqiy joy nomini kiriting.\n_Masalan: Dubay, Arabiston, Turkiya_",
    invalidDate: "❌ Iltimos, sanani to'g'ri formatda kiriting.\n_Masalan: 19-avgust yoki 20.08.2026 yoki 19/08/2026_",
    invalidPeople: "❌ Iltimos, odam sonini son ko'rinishida kiriting (1-50).\n_Masalan: 2 yoki 5_",
    invalidChildrenCount: "❌ Iltimos, bolalar sonini son ko'rinishida kiriting (1-50).",
    invalidChildrenMath: "❌ Bolalar soni umumiy odam sonidan kam bo'lishi kerak!\nSiz {p} kishi yozgansiz, bolalar soni {c} bo'lishi mumkin emas.",
    invalidAges: "❌ Iltimos, yoshlarni son ko'rinishida kiriting.\n_Masalan: 3, 5 yoki 3 5_",
    invalidAgesCount: "❌ Siz {n} ta bola deb yozgansiz, lekin {a} ta yoshini kiritdingiz.\nIltimos, har bir bola uchun yosh kiriting.\n_Masalan: 3, 5, 7_",
    invalidAgeValue: "❌ Yoshlar 0 dan 100 gacha bo'lishi kerak.",
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
    askName: "👤 Введите ваше имя и фамилию:\n_Например: Акмал Каримов_",
    askDestination: "📍 Куда хотите полететь?\n_Например: Дубай, Аравия, Турция_",
    askDate: "📅 Когда хотите полететь?\n_Например: 19 августа или 20.08.2026_",
    askPeople: "👥 Сколько человек?\n_От 1 до 50_",
    askChildren: "👶 Есть ли дети?",
    askChildrenCount: "👶 Сколько детей?",
    askChildrenAges: "🎂 Введите возраст детей через запятую.\n_Например: 3, 5, 7_",
    askContactTime: "📞 Когда удобно позвонить?",
    askPhone: "📱 Введите ваш номер телефона или нажмите кнопку ниже:",
    finish: "✅ Спасибо! Наши менеджеры свяжутся с вами в ближайшее время.",
    yes: "Да",
    no: "Нет",
    sharePhone: "📱 Отправить номер телефона",
    changeLanguage: "🌐 Til / Язык",
    invalidPhone: "❌ Введите номер телефона правильно или нажмите кнопку.\n_Минимум 7 цифр._",
    invalidName: "❌ Пожалуйста, введите настоящее имя и фамилию.\n_Только буквы, минимум 3 символа._\n_Например: Акмал Каримов_",
    invalidDestination: "❌ Пожалуйста, введите настоящее название места.\n_Например: Дубай, Аравия, Турция_",
    invalidDate: "❌ Пожалуйста, введите дату правильно.\n_Например: 19 августа или 20.08.2026 или 19/08/2026_",
    invalidPeople: "❌ Введите количество человек цифрой (1-50).\n_Например: 2 или 5_",
    invalidChildrenCount: "❌ Введите количество детей цифрой (1-50).",
    invalidChildrenMath: "❌ Количество детей должно быть меньше общего количества человек!\nВы указали {p} человек, детей не может быть {c}.",
    invalidAges: "❌ Пожалуйста, введите возраст числами.\n_Например: 3, 5 или 3 5_",
    invalidAgesCount: "❌ Вы указали {n} детей, но ввели {a} возрастов.\nПожалуйста, введите возраст для каждого ребенка.\n_Например: 3, 5, 7_",
    invalidAgeValue: "❌ Возраст должен быть от 0 до 100.",
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
