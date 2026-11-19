/* EduBridge demo — sample data (all fictional; fees are rough sample figures) */
(function () {
  const DAY = 86400000, H = 3600000;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function pickW(r, items, w) { const tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }

  const PHOTO = id => `https://images.unsplash.com/photo-${id}`;
  const COUNTRIES = {
    uk: { flag: 'gb', from: 75000, intakes: 'Sep · Jan' },
    ca: { flag: 'ca', from: 70000, intakes: 'Sep · Jan · May' },
    us: { flag: 'us', from: 90000, intakes: 'Aug · Jan' },
    au: { flag: 'au', from: 85000, intakes: 'Feb · Jul' },
    de: { flag: 'de', from: 6000, intakes: 'Oct · Apr' },
    ae: { flag: 'ae', from: 45000, intakes: 'Sep · Jan' },
    my: { flag: 'my', from: 20000, intakes: 'Feb · Sep' },
    tr: { flag: 'tr', from: 12000, intakes: 'Sep · Feb' },
  };
  const FIELDS = {
    business: { photo: '1522202176988-66273c2fd55f' }, cs: { photo: '1601392561050-340745ba9c25' }, eng: { photo: '1581091226033-d5c48150dbaa' },
    nursing: { photo: '1584432810601-6c7f27d2362b' }, data: { photo: '1666875753105-c63a6f3bdc86' }, med: { photo: '1571260899304-425eee4c7efc' },
  };
  // Real university names; tuition (SAR/yr), grade and IELTS figures are rough SAMPLE values for the demo only.
  const UNIS = [
    { id: 'u1', name: 'University of Oxford', ar: 'جامعة أكسفورد', c: 'uk', city: 'Oxford', fee: 165000, grade: 90, ielts: 7.0, fields: ['business', 'cs', 'eng', 'med', 'data'], levels: ['ug', 'pg'], photo: '1612563958093-2c3bcfbd8760', popular: true, schol: true },
    { id: 'u2', name: 'University of Manchester', ar: 'جامعة مانشستر', c: 'uk', city: 'Manchester', fee: 120000, grade: 75, ielts: 6.5, fields: ['business', 'cs', 'eng', 'nursing', 'data'], levels: ['ug', 'pg'], photo: '1568792923760-d70635a89fdc', popular: true, schol: true },
    { id: 'u3', name: 'University of Toronto', ar: 'جامعة تورنتو', c: 'ca', city: 'Toronto', fee: 160000, grade: 85, ielts: 6.5, fields: ['business', 'cs', 'eng', 'nursing', 'data', 'med'], levels: ['ug', 'pg'], photo: '1567762328132-9c6867ebb02e', popular: true, schol: true },
    { id: 'u4', name: 'University of British Columbia', ar: 'جامعة كولومبيا البريطانية', c: 'ca', city: 'Vancouver', fee: 140000, grade: 80, ielts: 6.5, fields: ['business', 'cs', 'eng', 'nursing', 'data'], levels: ['ug', 'pg'], photo: '1618255630366-f402c45736f6', popular: false, schol: true },
    { id: 'u5', name: 'Seneca Polytechnic', ar: 'سينيكا بوليتكنك', c: 'ca', city: 'Toronto', fee: 65000, grade: 60, ielts: 6.0, fields: ['business', 'cs', 'nursing', 'data'], levels: ['dip', 'pg'], photo: '1562774053-701939374585', popular: false, schol: false },
    { id: 'u6', name: 'Arizona State University', ar: 'جامعة ولاية أريزونا', c: 'us', city: 'Tempe', fee: 125000, grade: 70, ielts: 6.0, fields: ['business', 'cs', 'eng', 'data', 'nursing'], levels: ['ug', 'pg'], photo: '1606761568499-6d2451b23c66', popular: true, schol: true },
    { id: 'u7', name: 'Monash University', ar: 'جامعة موناش', c: 'au', city: 'Melbourne', fee: 115000, grade: 75, ielts: 6.5, fields: ['business', 'cs', 'eng', 'nursing', 'med', 'data'], levels: ['ug', 'pg'], photo: '1583373834259-46cc92173cb7', popular: true, schol: true },
    { id: 'u8', name: 'Technical University of Munich', ar: 'جامعة ميونخ التقنية', c: 'de', city: 'Munich', fee: 12000, grade: 85, ielts: 6.5, fields: ['cs', 'eng', 'data'], levels: ['ug', 'pg'], photo: '1588016985897-9514e8081342', popular: true, schol: false },
    { id: 'u9', name: 'Khalifa University', ar: 'جامعة خليفة', c: 'ae', city: 'Abu Dhabi', fee: 95000, grade: 80, ielts: 6.0, fields: ['cs', 'eng', 'data', 'med'], levels: ['ug', 'pg'], photo: '1627556704302-624286467c65', popular: false, schol: true },
    { id: 'u10', name: 'University of Malaya', ar: 'جامعة مالايا', c: 'my', city: 'Kuala Lumpur', fee: 30000, grade: 65, ielts: 6.0, fields: ['business', 'cs', 'eng', 'med', 'nursing', 'data'], levels: ['ug', 'pg', 'dip'], photo: '1623461487986-9400110de28e', popular: false, schol: true },
    { id: 'u11', name: 'Middle East Technical University', ar: 'جامعة الشرق الأوسط التقنية', c: 'tr', city: 'Ankara', fee: 14000, grade: 70, ielts: 6.0, fields: ['business', 'cs', 'eng', 'data'], levels: ['ug', 'pg'], photo: '1590012314607-cda9d9b699ae', popular: false, schol: false },
  ];
  const COUNSELLORS = [
    { id: 'k1', name: { en: 'Ayesha Siddiqui', ar: 'عائشة صديقي' }, langs: 'EN · UR', cs: ['uk', 'ca'] },
    { id: 'k2', name: { en: 'Omar Al-Harbi', ar: 'عمر الحربي' }, langs: 'AR · EN', cs: ['us', 'ae'] },
    { id: 'k3', name: { en: 'Hira Shah', ar: 'حرا شاه' }, langs: 'EN · UR · AR', cs: ['au', 'my'] },
    { id: 'k4', name: { en: 'Faisal Al-Qahtani', ar: 'فيصل القحطاني' }, langs: 'AR · EN', cs: ['de', 'tr'] },
    { id: 'k5', name: { en: 'Zainab Raza', ar: 'زينب رضا' }, langs: 'EN · UR', cs: ['ca', 'uk'] },
  ];
  const PK_F = [['Ali', 'علي', 'm'], ['Sara', 'سارہ', 'f'], ['Ahmed', 'أحمد', 'm'], ['Fatima', 'فاطمة', 'f'], ['Hassan', 'حسن', 'm'], ['Ayesha', 'عائشة', 'f'], ['Bilal', 'بلال', 'm'], ['Zara', 'زارا', 'f'], ['Usman', 'عثمان', 'm'], ['Hira', 'حرا', 'f'], ['Hamza', 'حمزة', 'm'], ['Mariam', 'مريم', 'f']];
  const PK_L = [['Khan', 'خان'], ['Ahmed', 'أحمد'], ['Raza', 'رضا'], ['Noor', 'نور'], ['Malik', 'ملك'], ['Tariq', 'طارق'], ['Hussain', 'حسين'], ['Sheikh', 'شيخ'], ['Qureshi', 'قريشي'], ['Butt', 'بٹ'], ['Iqbal', 'إقبال'], ['Javed', 'جاويد']];
  const SA_F = [['Abdullah', 'عبدالله', 'm'], ['Noura', 'نورة', 'f'], ['Faisal', 'فيصل', 'm'], ['Reem', 'ريم', 'f'], ['Khalid', 'خالد', 'm'], ['Lama', 'لمى', 'f'], ['Turki', 'تركي', 'm'], ['Joud', 'جود', 'f'], ['Rakan', 'راكان', 'm'], ['Shahad', 'شهد', 'f'], ['Yousef', 'يوسف', 'm'], ['Dana', 'دانة', 'f']];
  const SA_L = [['Al-Harbi', 'الحربي'], ['Al-Qahtani', 'القحطاني'], ['Al-Otaibi', 'العتيبي'], ['Al-Ghamdi', 'الغامدي'], ['Al-Zahrani', 'الزهراني'], ['Al-Dosari', 'الدوسري'], ['Al-Shehri', 'الشهري'], ['Al-Mutairi', 'المطيري'], ['Al-Subaie', 'السبيعي'], ['Al-Anazi', 'العنزي'], ['Al-Malki', 'المالكي'], ['Al-Rashid', 'الراشد']];
  const SOURCES = ['website', 'whatsapp', 'facebook', 'instagram', 'referral'];
  const STATUSES = ['new', 'contacted', 'followup', 'converted', 'lost'];
  const STAGES = ['docs', 'applied', 'offer', 'visa', 'enrolled', 'rejected'];

  function seed() {
    const r = rng(20261120);
    const now = Date.now();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const span = now - yearStart;
    const used = new Set();
    const enquiries = [];
    const N = 168;
    for (let i = 0; i < N; i++) {
      const pk = r() < 0.55;
      let f, l, key, tries = 0;
      do { f = pick(r, pk ? PK_F : SA_F); l = pick(r, pk ? PK_L : SA_L); key = f[0] + l[0]; tries++; } while (used.has(key) && tries < 20);
      used.add(key);
      // more enquiries in recent months
      const age = Math.floor(Math.pow(r(), 1.6) * span);
      const ageD = age / DAY;
      const field = pickW(r, ['cs', 'business', 'eng', 'nursing', 'data', 'med'], [32, 21, 18, 12, 11, 6]);
      const country = pickW(r, Object.keys(COUNTRIES), pk ? [24, 26, 8, 14, 8, 6, 9, 5] : [26, 18, 22, 12, 6, 8, 4, 4]);
      const level = pickW(r, ['ug', 'pg', 'dip'], [45, 42, 13]);
      let status;
      if (ageD < 4) status = pickW(r, STATUSES, [70, 25, 5, 0, 0]);
      else if (ageD < 25) status = pickW(r, STATUSES, [12, 30, 33, 18, 7]);
      else status = pickW(r, STATUSES, [3, 17, 18, 40, 22]);
      const unis = UNIS.filter(u => u.c === country && u.fields.includes(field));
      const uni = unis.length ? pick(r, unis) : null;
      const grade = Math.round(58 + r() * 37);
      const ielts = r() < 0.25 ? null : Math.round((5 + r() * 2.5) * 2) / 2;
      const budget = Math.round(((uni ? uni.fee : COUNTRIES[country].from) * (0.7 + r() * 0.7)) / 5000) * 5000;
      enquiries.push({
        id: 'q' + (i + 1), name: { en: f[0] + ' ' + l[0], ar: f[1] + ' ' + l[1] }, g: f[2], nat: pk ? 'pk' : 'sa',
        phone: pk ? '+92 300 000 ' + String(1000 + Math.floor(r() * 8999)) : '+966 50 000 ' + String(1000 + Math.floor(r() * 8999)),
        email: (f[0] + '.' + l[0].replace('Al-', '')).toLowerCase() + '@example.com',
        source: pickW(r, SOURCES, [38, 28, 18, 10, 6]), status, country, level, field, uniId: uni ? uni.id : null,
        grade, ielts, budget, counsellor: status === 'new' ? null : pick(r, COUNSELLORS).id, created: now - age - Math.floor(r() * 10) * H, notes: '',
      });
    }
    enquiries.sort((a, b) => b.created - a.created);
    const top = [['Ali', 'علي', 'Khan', 'خان', 'cs', 'website', 'new', 'm', 'pk', 'ca'], ['Sara', 'سارہ', 'Ahmed', 'أحمد', 'business', 'whatsapp', 'contacted', 'f', 'pk', 'uk'], ['Abdullah', 'عبدالله', 'Al-Harbi', 'الحربي', 'data', 'facebook', 'followup', 'm', 'sa', 'us'], ['Fatima', 'فاطمة', 'Noor', 'نور', 'nursing', 'instagram', 'converted', 'f', 'pk', 'au'], ['Noura', 'نورة', 'Al-Qahtani', 'القحطاني', 'eng', 'website', 'new', 'f', 'sa', 'ca']];
    top.forEach((tp, i) => {
      const e = enquiries[i]; const unis = UNIS.filter(u => u.c === tp[9] && u.fields.includes(tp[4]));
      Object.assign(e, { name: { en: tp[0] + ' ' + tp[2], ar: tp[1] + ' ' + tp[3] }, field: tp[4], source: tp[5], status: tp[6], g: tp[7], nat: tp[8], country: tp[9], uniId: unis[0] ? unis[0].id : null, created: now - (i * 5 + 1) * H, counsellor: tp[6] === 'new' ? null : 'k1', email: (tp[0] + '.' + tp[2].replace('Al-', '')).toLowerCase() + '@example.com', phone: tp[8] === 'pk' ? '+92 300 000 ' + (4100 + i) : '+966 50 000 ' + (4100 + i) });
    });

    // applications for converted / follow-up enquiries
    const applications = [];
    enquiries.filter(e => (e.status === 'converted' || e.status === 'followup') && e.uniId).slice(0, 34).forEach((e, i) => {
      const ageD = (now - e.created) / DAY;
      let stage = e.status === 'followup' ? pickW(r, STAGES, [60, 40, 0, 0, 0, 0]) : ageD > 120 ? pickW(r, STAGES, [0, 5, 15, 20, 50, 10]) : pickW(r, STAGES, [10, 30, 30, 20, 5, 5]);
      applications.push({ id: 'a' + (i + 1), enqId: e.id, name: e.name, uniId: e.uniId, field: e.field, level: e.level, stage, intake: pick(r, ['Jan 2027', 'Sep 2027', 'Feb 2027']), updated: e.created + 3 * DAY });
    });

    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const today = t0.getTime();
    const followups = [];
    const fuPool = enquiries.filter(e => ['contacted', 'followup'].includes(e.status)).slice(0, 12);
    fuPool.forEach((e, i) => followups.push({ id: 'f' + (i + 1), enqId: e.id, channel: ['wa', 'call', 'wa', 'email'][i % 4], due: today + (i - 3) * DAY / 2 + (10 + i % 6) * H, done: false }));

    const E = i => enquiries[i];
    const tasks = [
      { id: 't1', k: 'task.call', n: E(0).name, f: E(0).field, due: today + 11 * H, done: false },
      { id: 't2', k: 'task.docs', n: E(1).name, due: today + 14 * H, done: false },
      { id: 't3', k: 'task.sop', n: E(2).name, due: today + 17 * H, done: false },
      { id: 't4', k: 'task.ielts', n: E(4).name, due: today + DAY + 10 * H, done: false },
      { id: 't5', k: 'task.visa', n: E(3).name, due: today + 2 * DAY + 12 * H, done: false },
      { id: 't6', k: 'task.call', n: E(6).name, f: E(6).field, due: today + 3 * DAY + 15 * H, done: false },
      { id: 't7', k: 'task.docs', n: E(8).name, due: today - DAY + 11 * H, done: true },
    ];

    const chats = [
      { id: 'w1', enqId: E(0).id, unread: 2, msgs: [
        { me: 0, at: now - 2 * H, t: { en: 'Hi, I want to study Computer Science in Canada. What are the requirements?', ar: 'مرحباً، أريد دراسة علوم الحاسب في كندا. ما هي الشروط؟', ur: 'السلام علیکم، میں کینیڈا میں کمپیوٹر سائنس پڑھنا چاہتا ہوں۔ شرائط کیا ہیں؟' } },
        { me: 1, at: now - 2 * H + 60000, ai: 1, t: { en: 'Great choice! 🇨🇦 Most programs ask for around 75–85% in your last qualification and IELTS 6.5. Would you like me to check your eligibility?', ar: 'اختيار رائع! 🇨🇦 تطلب معظم البرامج معدلاً بين 75 و85% وآيلتس 6.5. هل تريد أن أتحقق من أهليتك؟', ur: 'بہترین انتخاب! 🇨🇦 زیادہ تر پروگرامز میں 75 سے 85 فیصد اور IELTS 6.5 درکار ہوتا ہے۔ کیا میں آپ کی اہلیت چیک کروں؟' } },
        { me: 0, at: now - 1.8 * H, t: { en: 'Yes. I have 82% in FSc and IELTS 6.5.', ar: 'نعم. معدلي 82% وآيلتس 6.5.', ur: 'جی۔ میرے FSc میں 82% ہیں اور IELTS 6.5۔' } },
        { me: 0, at: now - 1.7 * H, t: { en: 'Also, how much is the tuition fee?', ar: 'وكم تبلغ الرسوم الدراسية؟', ur: 'اور فیس کتنی ہے؟' } },
      ] },
      { id: 'w2', enqId: E(1).id, unread: 1, msgs: [
        { me: 0, at: now - 7 * H, t: { en: 'Assalam o Alaikum, I am interested in an MBA in the UK for the January intake.', ar: 'السلام عليكم، أنا مهتمة بالماجستير في إدارة الأعمال في بريطانيا لقبول يناير.', ur: 'السلام علیکم، مجھے جنوری انٹیک کے لیے برطانیہ میں MBA میں دلچسپی ہے۔' } },
        { me: 1, at: now - 6.9 * H, t: { en: 'Wa Alaikum Assalam Sara! The University of Manchester has a January option. Could you share your transcripts?', ar: 'وعليكم السلام سارة! جامعة مانشستر لديها قبول في يناير. هل يمكنك إرسال كشف الدرجات؟', ur: 'وعلیکم السلام سارہ! یونیورسٹی آف مانچسٹر میں جنوری کا آپشن ہے۔ کیا آپ ٹرانسکرپٹس بھیج سکتی ہیں؟' } },
        { me: 0, at: now - 5 * H, t: { en: 'Sure, sending them today.', ar: 'بالتأكيد، سأرسلها اليوم.', ur: 'جی ضرور، آج بھیج دوں گی۔' } },
      ] },
      { id: 'w3', enqId: E(2).id, unread: 0, msgs: [
        { me: 1, at: now - 26 * H, t: { en: 'Hello Abdullah, following up on Data Science in the USA — did you get a chance to look at Arizona State?', ar: 'مرحباً عبدالله، متابعة بخصوص علم البيانات في أمريكا — هل اطلعت على جامعة ولاية أريزونا؟', ur: 'سلام عبداللہ، امریکا میں ڈیٹا سائنس کے بارے میں فالو اپ — کیا آپ نے ایریزونا اسٹیٹ دیکھی؟' } },
        { me: 0, at: now - 24 * H, t: { en: 'Yes, looks good. Are there scholarships?', ar: 'نعم، تبدو جيدة. هل توجد منح؟', ur: 'جی، اچھی لگی۔ کیا اسکالرشپ ہے؟' } },
      ] },
      { id: 'w4', enqId: E(3).id, unread: 0, msgs: [
        { me: 1, at: now - 50 * H, t: { en: 'Congratulations Fatima! 🎉 Your offer from Monash University has arrived. Next step: visa documents.', ar: 'مبروك فاطمة! 🎉 وصل قبولك من جامعة موناش. الخطوة التالية: مستندات التأشيرة.', ur: 'مبارک ہو فاطمہ! 🎉 موناش یونیورسٹی سے آپ کی آفر آ گئی۔ اگلا قدم: ویزا کے کاغذات۔' } },
        { me: 0, at: now - 49 * H, t: { en: 'Thank you so much! Please share the checklist.', ar: 'شكراً جزيلاً! أرسلوا لي القائمة من فضلكم.', ur: 'بہت شکریہ! چیک لسٹ بھیج دیں۔' } },
      ] },
    ];
    const notifs = [
      { id: 'n1', k: 'notif.n1', v: { src: 'src.website', name: E(0).name }, at: now - H, read: false },
      { id: 'n2', k: 'notif.n2', v: { name: E(3).name }, at: now - 6 * H, read: false },
      { id: 'n3', k: 'notif.n3', v: { name: E(2).name }, at: now - 20 * H, read: false },
      { id: 'n4', k: 'notif.n4', v: {}, at: now - 28 * H, read: true },
    ];
    return { v: 1, seededAt: now, enquiries, applications, followups, tasks, chats, notifs };
  }

  window.SEED = { seed, COUNTRIES, FIELDS, UNIS, COUNSELLORS, SOURCES, STATUSES, STAGES, PHOTO, DAY };
})();
