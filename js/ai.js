/* EduBridge AI — /api/chat (Gemini → Groq) with rule-based fallback in EN/AR/UR */
(function () {
  const AI = { live: null };
  async function post(body) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 22000);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error('http');
      const j = await r.json(); if (!j || j.fallback || !j.data) throw new Error('fallback');
      AI.live = true; return j.data;
    } finally { clearTimeout(to); }
  }
  AI.health = async () => { try { const j = await (await fetch('/api/health')).json(); AI.live = !!j.ai; } catch (e) { AI.live = false; } return AI.live; };

  const toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const RX = {
    country: [['uk', /\b(uk|u\.k|england|britain|london|united kingdom)\b|بريطانيا|انجلترا|إنجلترا|برطانیہ|انگلینڈ|یوکے/i], ['ca', /canada|كندا|کینیڈا/i], ['us', /\b(usa|us|america|united states)\b|أمريكا|امريكا|امریکا|امریکہ/i], ['au', /australia|أستراليا|استراليا|آسٹریلیا/i], ['de', /germany|ألمانيا|المانيا|جرمنی/i], ['ae', /\b(uae|dubai|abu dhabi|emirates)\b|الإمارات|الامارات|دبي|یو اے ای|دبئی/i], ['my', /malaysia|ماليزيا|ملائیشیا/i], ['tr', /turkey|türkiye|turkiye|تركيا|ترکی/i]],
    level: [['pg', /post ?grad|master|mba|\bms\b|msc|phd|ماجستير|دراسات عليا|ماسٹر|پوسٹ ?گریجویٹ/i], ['ug', /under ?grad|bachelor|\bbs\b|bsc|بكالوريوس|بیچلر|انڈرگریجویٹ/i], ['dip', /diploma|دبلوم|ڈپلوما/i]],
    field: [['cs', /computer|software|\bcs\b|\bit\b|حاسب|حاسوب|برمجة|کمپیوٹر|سافٹ ویئر/i], ['business', /business|mba|management|finance|account|marketing|إدارة|أعمال|ادارة|بزنس|مینجمنٹ/i], ['eng', /engineer|هندسة|انجینئر/i], ['nursing', /nurs|تمريض|نرسنگ/i], ['data', /data|\bai\b|analytics|بيانات|ڈیٹا/i], ['med', /medic|mbbs|doctor|طب|ميديسن|میڈیسن|ڈاکٹر/i]],
  };
  AI.extract = function (text) {
    const s = toLatin(text), o = {};
    for (const k of ['country', 'level', 'field']) for (const [v, r] of RX[k]) if (r.test(s)) { o[k] = v; break; }
    const ph = s.replace(/[\s-]/g, '').match(/(?:\+?966|0)5\d{8}|(?:\+?92|0)3\d{9}/); if (ph) o.phone = ph[0];
    const nm = s.match(/(?:my name is|i am|i'm|name:)\s+([A-Za-z؀-ۿ]+(?:\s+[A-Za-z؀-ۿ]+)?)/i) || s.match(/(?:اسمي|انا|أنا)\s+([؀-ۿ]+(?:\s+[؀-ۿ]+)?)/) || s.match(/(?:میرا نام)\s+([؀-ۿA-Za-z]+(?:\s+[؀-ۿA-Za-z]+)?)/);
    if (nm) o.name = nm[1].replace(/\s+(and|و|اور|ہے)$/i, '').trim();
    const g = s.match(/(\d{2}(?:\.\d+)?)\s*%/) || s.match(/(?:grade|marks|percentage|gpa|معدل|نسبة|گریڈ|نمبر|فیصد)\D{0,6}(\d{2}(?:\.\d+)?)/i); if (g) o.grade = +g[1];
    const ie = s.match(/(?:ielts|آيلتس|ايلتس)\D{0,4}(\d(?:\.\d)?)/i); if (ie) o.ielts = +ie[1]; else if (/ielts\s*(none|no)|بدون آيلتس|لا يوجد|نہیں/i.test(s)) o.ielts = 0;
    let m;
    if ((m = s.match(/(\d+(?:\.\d+)?)\s*(?:k\b|ألف|الف|ہزار)/i))) o.budget = +m[1] * 1000;
    else if ((m = s.match(/(?:budget|ميزانية|الميزانية|بجٹ)\D{0,6}([\d,]{4,9})/i))) o.budget = +m[1].replace(/,/g, '');
    else if ((m = s.replace(/,/g, '').match(/\b(\d{5,7})\b/)) && !o.phone) o.budget = +m[1];
    return o;
  };

  /* ---------- free-text adviser answer ---------- */
  const FB = {
    en: { generic: 'Good question! A counsellor can confirm the exact details for you. Meanwhile, I can check your eligibility, share fee details or show more universities.', schol: 'Many universities offer merit scholarships (usually 10–50% of tuition) based on grades and IELTS. Your counsellor will match you with options.', visa: 'We help step by step: offer letter → financial documents → visa application → interview prep. Your counsellor will share the checklist for your country.', ielts: 'Most universities ask for IELTS 6.0–7.0. Some accept an English-medium certificate or offer pre-sessional English.' },
    ar: { generic: 'سؤال ممتاز! يمكن للمستشار تأكيد التفاصيل الدقيقة لك. وحتى ذلك، يمكنني التحقق من أهليتك أو إرسال تفاصيل الرسوم أو عرض جامعات أخرى.', schol: 'تقدم جامعات كثيرة منحاً للتفوق (عادة 10–50% من الرسوم) حسب المعدل والآيلتس. سيرشح لك المستشار الخيارات المناسبة.', visa: 'نساعدك خطوة بخطوة: خطاب القبول ← المستندات المالية ← طلب التأشيرة ← التحضير للمقابلة. سيرسل لك المستشار القائمة الخاصة بدولتك.', ielts: 'تطلب معظم الجامعات آيلتس بين 6.0 و7.0، وبعضها يقبل شهادة دراسة بالإنجليزية أو يوفر برنامج لغة تحضيري.' },
    ur: { generic: 'اچھا سوال! کاؤنسلر آپ کو درست تفصیل بتا دے گا۔ تب تک میں آپ کی اہلیت چیک کر سکتا ہوں، فیس بتا سکتا ہوں یا مزید یونیورسٹیاں دکھا سکتا ہوں۔', schol: 'بہت سی یونیورسٹیاں گریڈز اور IELTS کی بنیاد پر میرٹ اسکالرشپ دیتی ہیں (عموماً فیس کا 10 سے 50 فیصد)۔ کاؤنسلر آپ کے لیے آپشنز ڈھونڈے گا۔', visa: 'ہم قدم بہ قدم مدد کرتے ہیں: آفر لیٹر ← مالی دستاویزات ← ویزا درخواست ← انٹرویو کی تیاری۔ کاؤنسلر آپ کے ملک کی چیک لسٹ بھیجے گا۔', ielts: 'زیادہ تر یونیورسٹیاں IELTS 6.0 سے 7.0 مانگتی ہیں۔ کچھ انگلش میڈیم سرٹیفکیٹ قبول کرتی ہیں یا پری سیشنل انگلش کرواتی ہیں۔' },
  };
  AI.adviserFree = async function (history, ctx, unis, lang) {
    try {
      const d = await post({ mode: 'adviser', lang, messages: history.slice(-10), ctx: { country: ctx.country, level: ctx.level, field: ctx.field }, universities: unis.map(u => ({ id: u.id, name: u.name, country: u.c, city: u.city, tuition_sar_year: u.fee, min_grade_pct: u.grade, ielts: u.ielts, fields: u.fields, levels: u.levels, scholarships: u.schol })) });
      return { reply: d.reply, unis: (d.unis || []).filter(id => unis.some(u => u.id === id)).slice(0, 3), live: true, lead: d.lead };
    } catch (e) {
      const s = toLatin(history[history.length - 1].text); const L = FB[lang] || FB.en;
      const reply = /scholar|منح|منحة|اسکالرشپ|وظيفة/i.test(s) ? L.schol : /visa|تأشيرة|ويزا|ویزا/i.test(s) ? L.visa : /ielts|english|آيلتس|انگلش|انجليزي/i.test(s) ? L.ielts : L.generic;
      return { reply, unis: [], live: false };
    }
  };

  /* ---------- eligibility ---------- */
  function fbElig(p, unis, lang) {
    const res = unis.map(u => {
      let s = 50; const why = [];
      if (p.grade != null) { const d = p.grade - u.grade; s += Math.max(-30, Math.min(25, d * 2)); }
      if (p.ielts != null) { const d = (p.ielts || 0) - u.ielts; s += p.ielts === 0 ? -15 : d >= 0 ? 15 : d * 20; }
      if (p.budget) s += p.budget >= u.fee ? 10 : p.budget >= u.fee * 0.8 ? -5 : -20;
      return { u, s: Math.max(5, Math.min(97, Math.round(s))) };
    });
    const best = res.sort((a, b) => b.s - a.s)[0] || { s: 50 };
    const result = best.s >= 70 ? 'likely' : best.s >= 45 ? 'borderline' : 'unlikely';
    const u = best.u;
    const T = {
      en: () => [u && p.grade != null ? `Your grade ${p.grade}% vs about ${u.grade}% usually asked by ${u.name}` : 'Grades not shared yet', p.ielts ? `IELTS ${p.ielts} vs ${u ? u.ielts : 6.5} required` : 'No IELTS yet — needed for most universities', p.budget && u ? (p.budget >= u.fee ? 'Budget covers the sample tuition' : 'Budget is below the sample tuition') : 'Budget not shared'],
      ar: () => [u && p.grade != null ? `معدلك ${p.grade}% مقابل حوالي ${u.grade}% تطلبه ${u.ar}` : 'لم يتم إرسال المعدل', p.ielts ? `آيلتس ${p.ielts} مقابل ${u ? u.ielts : 6.5} مطلوب` : 'لا يوجد آيلتس — مطلوب لمعظم الجامعات', p.budget && u ? (p.budget >= u.fee ? 'الميزانية تغطي الرسوم التجريبية' : 'الميزانية أقل من الرسوم التجريبية') : 'لم يتم إرسال الميزانية'],
      ur: () => [u && p.grade != null ? `آپ کا گریڈ ${p.grade}% جبکہ ${u.name} تقریباً ${u.grade}% مانگتی ہے` : 'گریڈز نہیں بتائے', p.ielts ? `IELTS ${p.ielts} جبکہ ${u ? u.ielts : 6.5} درکار` : 'IELTS نہیں — زیادہ تر یونیورسٹیوں میں ضروری', p.budget && u ? (p.budget >= u.fee ? 'بجٹ سیمپل فیس کے لیے کافی ہے' : 'بجٹ سیمپل فیس سے کم ہے') : 'بجٹ نہیں بتایا'],
    };
    const NX = { en: ['Share transcripts with your counsellor', result === 'likely' ? 'Start the application before the deadline' : 'Consider a foundation/diploma pathway or improve IELTS'], ar: ['أرسل كشف الدرجات للمستشار', result === 'likely' ? 'ابدأ التقديم قبل الموعد النهائي' : 'فكّر في برنامج تأسيسي/دبلوم أو حسّن درجة الآيلتس'], ur: ['ٹرانسکرپٹس کاؤنسلر کو بھیجیں', result === 'likely' ? 'آخری تاریخ سے پہلے اپلائی شروع کریں' : 'فاؤنڈیشن/ڈپلوما پاتھ وے سوچیں یا IELTS بہتر کریں'] };
    return { result, score: best.s, reasons: (T[lang] || T.en)(), next: NX[lang] || NX.en, live: false };
  }
  AI.eligibility = async function (p, unis, lang) {
    try {
      const d = await post({ mode: 'eligibility', lang, profile: { grade_pct: p.grade, ielts: p.ielts, budget_sar_year: p.budget, country: p.country, level: p.level, field: p.field }, universities: unis.map(u => ({ name: u.name, tuition_sar_year: u.fee, min_grade_pct: u.grade, ielts: u.ielts })) });
      const r = ['likely', 'borderline', 'unlikely'].includes(d.result) ? d.result : 'borderline';
      return { result: r, score: Math.max(1, Math.min(99, parseInt(d.score, 10) || 50)), reasons: (d.reasons || []).slice(0, 3).map(String), next: (d.next_steps || []).slice(0, 3).map(String), live: true };
    } catch (e) { return fbElig(p, unis, lang); }
  };

  /* ---------- follow-up & reply ---------- */
  function brief(e, uni) { return { name: e.name.en, country: e.country, level: e.level, field: e.field, status: e.status, source: e.source, grade_pct: e.grade, ielts: e.ielts, budget_sar_year: e.budget, university: uni ? uni.name : null, days_since_enquiry: Math.round((Date.now() - e.created) / 864e5) }; }
  AI.followup = async function (e, uni, lang, agent) {
    try { const d = await post({ mode: 'followup', lang, agent, lead: brief(e, uni) }); if (!d.message) throw 0; return { text: String(d.message), live: true }; }
    catch (x) {
      const n = (lang === 'en' ? e.name.en : e.name.ar).split(' ')[0]; const f = I18N.t('f.' + e.field), c = I18N.t('c.' + e.country);
      const T = {
        en: `Hi ${n}, this is ${agent} from EduBridge 👋\nThank you for your interest in ${f} in ${c}${uni ? ' (e.g. ' + uni.name + ')' : ''}. I can check your eligibility and share fees and intake dates.\nCould you send your latest transcript and IELTS score? Would a quick call tomorrow work?`,
        ar: `مرحباً ${n}، معك ${agent} من EduBridge 👋\nشكراً لاهتمامك بدراسة ${f} في ${c}${uni ? ' (مثل ' + uni.ar + ')' : ''}. يمكنني التحقق من أهليتك وإرسال الرسوم ومواعيد القبول.\nهل يمكنك إرسال آخر كشف درجات ودرجة الآيلتس؟ هل يناسبك اتصال قصير غداً؟`,
        ur: `السلام علیکم ${n}، میں EduBridge سے ${agent} بات کر رہا ہوں 👋\n${c} میں ${f} میں دلچسپی کا شکریہ${uni ? ' (جیسے ' + uni.name + ')' : ''}۔ میں آپ کی اہلیت چیک کر کے فیس اور داخلے کی تاریخیں بتا سکتا ہوں۔\nکیا آپ اپنا تازہ ٹرانسکرپٹ اور IELTS اسکور بھیج سکتے ہیں؟ کیا کل ایک مختصر کال ٹھیک رہے گی؟`,
      };
      return { text: T[lang] || T.en, live: false };
    }
  };
  AI.suggestReply = async function (msgs, e, uni, lang, agent) {
    try { const d = await post({ mode: 'reply', lang, agent, lead: brief(e, uni), messages: msgs }); if (!d.message) throw 0; return { text: String(d.message), live: true }; }
    catch (x) {
      const T = { en: 'Thank you! With 82% and IELTS 6.5 you look like a good fit for many Canadian programs. Sample tuition is around SAR 65,000–160,000 per year depending on the university. Shall I book a call with your counsellor to shortlist options?', ar: 'شكراً لك! بمعدل 82% وآيلتس 6.5 تبدو مناسباً لكثير من البرامج الكندية. الرسوم التجريبية تقارب 65,000–160,000 ريال سنوياً حسب الجامعة. هل أحجز لك اتصالاً مع المستشار لاختيار الأنسب؟', ur: 'شکریہ! 82% اور IELTS 6.5 کے ساتھ آپ کینیڈا کے کئی پروگرامز کے لیے موزوں لگتے ہیں۔ سیمپل فیس یونیورسٹی کے لحاظ سے تقریباً 65,000 سے 1,60,000 ریال سالانہ ہے۔ کیا کاؤنسلر کے ساتھ کال بک کر دوں تاکہ بہترین آپشنز چنیں؟' };
      return { text: T[lang] || T.en, live: false };
    }
  };
  window.AI = AI;
})();
