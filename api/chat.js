// EduBridge demo — AI endpoint (Gemini first, Groq fallback). Keys come only from Vercel env vars.
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const LANG = { en: 'English', ar: 'Arabic (Saudi-friendly Modern Standard Arabic)', ur: 'Urdu (Urdu script)' };

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 40;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

function buildPrompt(body) {
  const lang = LANG[body.lang] ? body.lang : 'en';
  const L = LANG[lang];
  const mode = body.mode;
  const lead = body.lead && typeof body.lead === 'object' ? body.lead : {};
  const agent = clip(body.agent || 'the EduBridge team', 60);
  const leadTxt = clip(JSON.stringify(lead), 1500);
  if (mode === 'adviser') {
    const unis = Array.isArray(body.universities) ? body.universities.slice(0, 15) : [];
    const ctx = clip(JSON.stringify(body.ctx || {}), 300);
    const sys = `You are "EduBridge AI Adviser", the study-abroad assistant of EduBridge, a sample education consultancy (live demo with sample data).
Reply in the same language the student writes in (English, Arabic or Urdu); if unclear use ${L}. Warm, short (max 70 words), like a WhatsApp chat. Students are mostly from Saudi Arabia and Pakistan; money in SAR.
The student's current choices: ${ctx}.
Only use facts from this sample university list (tuition, grade and IELTS figures are approximate sample data — say "approx." when quoting numbers):
${JSON.stringify(unis)}
Answer the student's question; if relevant suggest up to 3 universities by id in "unis" (do not write ids in the reply text). Offer to check eligibility, share fees or connect a counsellor.
If the student gives a name AND phone number, put them in "lead".
Never promise admission or visas. Never claim partnerships, partner universities, success rates or client numbers — call them "universities in our sample list". Do not ask for passwords, ID or passport numbers or payment details.
Return strict JSON only: {"reply": string, "unis": [ids], "lead": {"name": string, "phone": string} | null}`;
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: clip(m.text, 500) })).filter(m => m.text);
    return { sys, msgs };
  }
  if (mode === 'eligibility') {
    const prof = clip(JSON.stringify(body.profile || {}), 500), unis = clip(JSON.stringify((body.universities || []).slice(0, 6)), 1500);
    return { sys: `You are an admissions eligibility helper for a study-abroad consultancy demo (sample data). Compare the student's profile with each university's approximate requirements. Write in ${L}. Be honest and encouraging; never guarantee admission. Return strict JSON only: {"result": "likely"|"borderline"|"unlikely", "score": integer 1-99, "reasons": [3 short reasons, max 14 words each], "next_steps": [2 short steps]}`, msgs: [{ role: 'user', text: `Student: ${prof}\nUniversities: ${unis}` }] };
  }
  if (mode === 'followup') {
    return { sys: `You write WhatsApp follow-up messages for ${agent}, a study-abroad counsellor at "EduBridge". Write in ${L}. Polite, personal, max 75 words, 2-3 short lines, one emoji max, end with a simple question (e.g. ask for transcripts or propose a call). Do not invent facts beyond the student data; never promise admission. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Student: ' + leadTxt }] };
  }
  if (mode === 'reply') {
    const conv = (Array.isArray(body.messages) ? body.messages : []).slice(-6).map(m => `${m.role === 'agent' ? 'Counsellor' : 'Student'}: ${clip(m.text, 400)}`).join('\n');
    return { sys: `You are ${agent}, a study-abroad counsellor at "EduBridge". Suggest the next WhatsApp reply to the student in ${L}. Max 60 words, friendly, answer their last question using only the student data; label any fee as approximate. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: `Student: ${leadTxt}\nConversation:\n${conv}\nWrite the counsellor's next reply.` }] };
  }
  return null;
}

function parseJSON(txt) {
  if (!txt) return null;
  let t = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

async function timed(url, opts, ms) {
  const c = new AbortController(); const id = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(id); }
}

async function gemini(p) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const contents = p.msgs.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  for (const model of GEMINI_MODELS) {
    for (const thinking of [true, false]) {
      const gen = { temperature: 0.5, responseMimeType: 'application/json', maxOutputTokens: 700 };
      if (thinking) gen.thinkingConfig = { thinkingLevel: 'low' };
      try {
        const r = await timed(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: p.sys }] }, contents, generationConfig: gen }),
        }, 12000);
        if (r.status === 400 && thinking) continue; // retry same model without thinkingConfig
        if (!r.ok) break; // 404/429/500/503 → next model
        const j = await r.json();
        const txt = (j.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || '').join('');
        const data = parseJSON(txt);
        if (data) return { data, provider: 'gemini', model };
        break;
      } catch (e) { break; }
    }
  }
  return null;
}

async function groq(p) {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const messages = [{ role: 'system', content: p.sys }, ...p.msgs.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
    const r = await timed('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.5, max_tokens: 700, response_format: { type: 'json_object' } }),
    }, 12000);
    if (!r.ok) return null;
    const j = await r.json();
    const data = parseJSON(j.choices?.[0]?.message?.content);
    return data ? { data, provider: 'groq', model: GROQ_MODEL } : null;
  } catch (e) { return null; }
}

function clean(mode, d) {
  if (mode === 'adviser') {
    const out = { reply: clip(d.reply || d.message || '', 1200), unis: Array.isArray(d.unis) ? d.unis.map(String).slice(0, 3) : [], lead: null };
    if (d.lead && typeof d.lead === 'object' && d.lead.name) out.lead = { name: clip(d.lead.name, 60), phone: clip(d.lead.phone, 25) };
    return out.reply ? out : null;
  }
  if (mode === 'eligibility') return { result: d.result, score: d.score, reasons: Array.isArray(d.reasons) ? d.reasons.map(x => clip(x, 140)).slice(0, 3) : [], next_steps: Array.isArray(d.next_steps) ? d.next_steps.map(x => clip(x, 140)).slice(0, 3) : [] };
  return d.message ? { message: clip(d.message, 900) } : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  res.setHeader('Content-Type', 'application/json');
  if (limited(ip)) return res.end(JSON.stringify({ fallback: true, reason: 'rate' }));
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const p = buildPrompt(body);
  if (!p) return res.end(JSON.stringify({ fallback: true, reason: 'mode' }));
  const out = (await gemini(p)) || (await groq(p));
  const data = out && clean(body.mode, out.data);
  if (!data) return res.end(JSON.stringify({ fallback: true }));
  return res.end(JSON.stringify({ data, provider: out.provider }));
};
