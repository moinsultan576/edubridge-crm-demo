/* EduBridge demo — app (hash router, render functions, event delegation) */
(function () {
  'use strict';
  const KEY = 'edubridge_demo_v1', UKEY = 'edubridge_user', PKEY = 'edubridge_prefs';
  const FORM_URL = 'https://formsubmit.co/ajax/moinseoagency@gmail.com';
  const WA_AGENCY = '966546904384';
  const t = (k, v) => I18N.t(k, v);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const { COUNTRIES, FIELDS, UNIS, COUNSELLORS, STAGES } = SEED;

  /* ---------- state ---------- */
  function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  let D = ls(KEY, null);
  if (!D || D.v !== 1 || Date.now() - D.seededAt > 12 * 3600000) { D = SEED.seed(); lsSet(KEY, D); }
  let USER = ls(UKEY, null);
  const PREFS = Object.assign({ lang: null, theme: 'light' }, ls(PKEY, {}));
  const UI = { src: 'all', ef: { q: '', st: '', src: '', c: '' }, page: 1, tf: 'open', chat: null, sidebar: false, menus: null };
  const save = () => lsSet(KEY, D), savePrefs = () => lsSet(PKEY, PREFS);
  (function () { let l = PREFS.lang; if (!l) { const n = (navigator.language || 'en').slice(0, 2); l = n === 'ar' ? 'ar' : n === 'ur' ? 'ur' : 'en'; } I18N.set(l); document.documentElement.dataset.theme = PREFS.theme; })();

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = () => I18N.lang;
  const nm = o => !o ? '' : typeof o === 'string' ? o : (L() === 'en' ? o.en : (o.ar || o.en));
  const bdi = s => '<bdi>' + esc(s) + '</bdi>';
  const numF = new Intl.NumberFormat('en-US'), cmpF = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const sar = (n, c) => { const v = c ? cmpF.format(n) : numF.format(Math.round(n)); return L() === 'en' ? 'SAR ' + v : v + ' ' + t('common.sar'); };
  const sarH = (n, c) => bdi(sar(n, c));
  const dateF = (ts, o) => new Intl.DateTimeFormat(I18N.locale(), o || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));
  const timeF = ts => new Intl.DateTimeFormat(L() === 'en' ? 'en-US' : I18N.locale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
  function rel(ts) { const rtf = new Intl.RelativeTimeFormat(L() === 'ar' ? 'ar-u-nu-latn' : L() === 'ur' ? 'ur-u-nu-latn' : 'en', { numeric: 'auto' }); const d = (ts - Date.now()) / 1000, a = Math.abs(d); return a < 3600 ? rtf.format(Math.round(d / 60), 'minute') : a < 86400 ? rtf.format(Math.round(d / 3600), 'hour') : rtf.format(Math.round(d / 86400), 'day'); }
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const photo = (id, w, h) => `${SEED.PHOTO(id)}?auto=format&fit=crop&w=${w || 600}${h ? '&h=' + h : ''}&q=70`;
  const flag = (c, cls) => `<img class="flag ${cls || ''}" src="assets/flags/${COUNTRIES[c].flag}.svg" alt="" width="28" height="21">`;
  const uni = id => UNIS.find(u => u.id === id);
  const uniName = u => u ? (L() === 'en' ? u.name : u.ar) : '—';
  const csl = id => COUNSELLORS.find(c => c.id === id);
  const enq = id => D.enquiries.find(e => e.id === id);
  const userName = () => (USER && USER.name) || 'Guest';
  const COLORS = ['#16a34a', '#f97316', '#0ea5e9', '#8b5cf6', '#ec4899', '#eab308', '#14b8a6', '#ef4444'];
  function avatar(name, size) { const n = nm(name) || '?'; const p = n.trim().split(/\s+/); const ini = (p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : ''); let h = 0; for (const c of (name && name.en) || n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `<span class="av ${size || ''}" style="--c:${COLORS[h % COLORS.length]}">${esc(ini.toUpperCase())}</span>`; }
  const SRC_C = { website: '#3b82f6', whatsapp: '#22c55e', facebook: '#8b5cf6', instagram: '#f59e0b', referral: '#ef4444', aichat: '#0d9488' };
  const srcTag = s => `<span class="src"><i style="background:${SRC_C[s]}"></i>${esc(t('src.' + s))}</span>`;
  const stTag = s => `<span class="pill st-${s}">${esc(t('st.' + s))}</span>`;
  const stgTag = s => `<span class="pill stg-${s}">${esc(t('stg.' + s))}</span>`;
  function toast(msg, kind) { const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = icon(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>'; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3000); }
  function sendForm(p) { try { fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _captcha: 'false', _template: 'table' }, p)) }).catch(() => {}); } catch (e) {} }
  function modal(title, body, cls) { const m = $('#modal'); m.innerHTML = `<div class="mback" data-act="closeModal"></div><div class="mbox ${cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mhead"><h3>${esc(title)}</h3><button class="ibtn" data-act="closeModal" aria-label="${t('common.close')}">${icon('x')}</button></div><div class="mbody">${body}</div></div>`; m.classList.add('open'); document.body.classList.add('noscroll'); const f = m.querySelector('input,select,textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); }
  function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; document.body.classList.remove('noscroll'); }
  function drawer(html) { const d = $('#drawer'); d.innerHTML = `<div class="mback" data-act="closeDrawer"></div><aside class="dpanel">${html}</aside>`; d.classList.add('open'); document.body.classList.add('noscroll'); }
  function closeDrawer() { const d = $('#drawer'); d.classList.remove('open'); d.innerHTML = ''; document.body.classList.remove('noscroll'); }
  function addEnquiry(o) {
    const e = Object.assign({ id: uid('q'), g: 'm', nat: /^\+?92|^03/.test(o.phone || '') ? 'pk' : 'sa', email: '', status: 'new', country: 'uk', level: 'ug', field: 'cs', uniId: null, grade: null, ielts: null, budget: 0, counsellor: null, created: Date.now(), notes: '' }, o);
    D.enquiries.unshift(e);
    D.notifs.unshift({ id: uid('n'), k: 'notif.n1', v: { src: 'src.' + e.source, name: e.name }, at: Date.now(), read: false });
    D.tasks.push({ id: uid('t'), k: 'task.call', n: e.name, f: e.field, due: Date.now() + 2 * 3600000, done: false });
    save(); return e;
  }

  /* ---------- shared ---------- */
  function logo(dark) { return `<a class="logo ${dark ? 'dark' : ''}" href="#/" aria-label="EduBridge"><span class="lmark">${icon('capFill')}</span><span class="ltxt"><b>Edu<span>Bridge</span></b><small>${dark ? t('brand.crm') : t('brand.sub')}</small></span></a>`; }
  function langMenu(id) {
    const names = { en: 'English', ar: 'العربية', ur: 'اردو' }; const open = UI.menus === id;
    return `<div class="dd ${open ? 'open' : ''}"><button class="langbtn" data-act="menu" data-id="${id}" aria-haspopup="true" aria-expanded="${open}">${icon('globe')}<span>${L().toUpperCase()}</span>${icon('chevDown', 'sm')}</button><div class="ddm">${['en', 'ar', 'ur'].map(l => `<button data-act="lang" data-l="${l}" class="${l === L() ? 'on' : ''}">${names[l]}</button>`).join('')}</div></div>`;
  }
  const FIELD_KEYS = Object.keys(FIELDS);

  /* ================= LANDING ================= */
  function landing() {
    const svcs = [['cap', '#f97316', 1], ['uni', '#166534', 2], ['doc', '#2563eb', 3], ['capFill', '#a855f7', 4], ['book', '#0d9488', 5], ['plane', '#e11d48', 6]];
    return `<header class="lhead"><div class="wrap lhead-in">${logo()}
      <nav class="lnav" aria-label="main"><a href="#/" class="on">${t('nav.home')}</a><a href="#courses" data-act="scroll">${t('nav.courses')}</a><a href="#abroad" data-act="scroll">${t('nav.abroad')}</a><a href="#about" data-act="scroll">${t('nav.about')}</a><a href="#contact" data-act="scroll">${t('nav.contact')}</a><button class="lnk-crm show-sm-block" data-act="start">${t('nav.crm')}</button></nav>
      <div class="lacts">${langMenu('lang-l')}<button class="btn ghost hide-sm" data-act="start">${icon('chart')} ${t('nav.crm')}</button><button class="btn org hide-xs" data-act="scrollCons">${t('nav.cta')} ${icon('arrowRight', 'flip')}</button><button class="ibtn show-sm" data-act="lnav" aria-label="${t('common.menu')}">${icon('menu')}</button></div></div></header>
    <main>
    <section class="hero"><div class="hero-bg" aria-hidden="true"><img src="${photo('1568792923760-d70635a89fdc', 1400)}" alt=""></div><div class="wrap hero-in">
      <div class="hero-txt"><span class="badge">${t('hero.badge')}</span>
        <h1>${t('hero.t1')}<br>${t('hero.t2')}<br><span class="org-t">${t('hero.t3')}</span></h1>
        <p class="lead">${t('hero.sub')}</p>
        <ul class="trust"><li>${icon('bot')}<span>${t('hero.tr1')}</span></li><li>${icon('cap')}<span>${t('hero.tr2')}</span></li><li>${icon('shield')}<span>${t('hero.tr3')}</span></li></ul>
        <div class="hctas"><button class="btn org lg" data-act="scrollCons">${t('hero.cta')} ${icon('arrowRight', 'flip')}</button><button class="btn plain lg" data-act="openAI">${icon('play')} ${t('hero.watch')}</button></div></div>
      <div class="hero-vis"><div class="hero-photo"><img src="${photo('1492462543947-040389c4a66c', 900)}" alt="Student with a backpack"></div>
        <p class="script" aria-hidden="true">${t('hero.script1')}<br>${t('hero.script2')}</p>
        <div class="hcards">${[['globe', 1], ['user', 2], ['cap', 3]].map(c => `<div class="hcard">${icon(c[0])}<span>${t('hc.' + c[1])}</span></div>`).join('')}</div></div>
    </div></section>
    <section class="flags wrap" aria-label="countries">${Object.keys(COUNTRIES).map(c => `<button class="fl" data-act="aiCountry" data-c="${c}">${flag(c)}<span>${t('c.' + c)}</span></button>`).join('')}</section>
    <section class="wrap sec svc" id="services"><div class="sec-h"><div><span class="kick">${t('svc.kick')}</span><h2>${t('svc.t1')} ${t('svc.t2')}<br><span class="org-t">${t('svc.t3')}</span></h2><p class="muted">${t('svc.sub')}</p></div>
      <div class="arrows"><button class="ibtn round" data-act="svcScroll" data-d="-1" aria-label="previous">${icon('chevLeft', 'flip')}</button><button class="ibtn round" data-act="svcScroll" data-d="1" aria-label="next">${icon('chevRight', 'flip')}</button></div></div>
      <div class="svc-row" id="svcRow">${svcs.map(s => `<article class="scard"><span class="sic" style="--c:${s[1]}">${icon(s[0])}</span><h3>${t('svc.' + s[2])}</h3><p>${t('svc.' + s[2] + 's')}</p><button class="link" data-act="openAI">${t('svc.more')} ${icon('arrowRight', 'flip sm')}</button></article>`).join('')}</div></section>
    <section class="wrap" id="consult"><form class="cons" data-form="consult" novalidate><div class="cons-h">${icon('capFill')}<div><h3>${t('cons.t')}</h3><p>${t('cons.s')}</p></div></div>
      <div class="cons-f"><input name="name" required maxlength="60" placeholder="${t('cons.name')}" aria-label="${t('cons.name')}" autocomplete="name"><div class="phone"><select name="cc" aria-label="country code"><option value="+966">🇸🇦 +966</option><option value="+92">🇵🇰 +92</option></select><input name="phone" required maxlength="15" inputmode="tel" placeholder="${t('cons.wa')}" aria-label="${t('cons.wa')}"></div>
      <select name="field" required aria-label="${t('cons.course')}"><option value="">${t('cons.course')}</option>${FIELD_KEYS.map(f => `<option value="${f}">${t('f.' + f)}</option>`).join('')}</select><button class="btn org" type="submit">${t('cons.btn')} ${icon('arrowRight', 'flip')}</button></div>
      <p class="cons-n">${icon('shield', 'sm')} ${t('cons.note')}</p></form></section>
    <section class="wrap sec" id="courses"><span class="kick c">${t('crs.kick')}</span><h2 class="c">${t('crs.t')}</h2>
      <div class="fgrid">${FIELD_KEYS.map(f => `<button class="fcard" data-act="aiField" data-f="${f}"><img src="${photo(FIELDS[f].photo, 500, 320)}" alt="" loading="lazy"><div><b>${t('f.' + f)}</b><small>${t('crs.unis', { n: '<bdi>' + UNIS.filter(u => u.fields.includes(f)).length + '</bdi>' })}</small></div></button>`).join('')}</div></section>
    <section class="wrap sec" id="abroad"><span class="kick c">${t('ab.kick')}</span><h2 class="c">${t('ab.t')}</h2><p class="muted c">${t('ab.note')}</p>
      <div class="cgrid">${Object.keys(COUNTRIES).map(c => `<article class="ccard">${flag(c, 'big')}<h3>${t('c.' + c)}</h3><p><small>${t('ab.from')}</small> <b>${sarH(COUNTRIES[c].from)}</b> <small>${t('ab.yr')}</small></p><p class="muted sm">${t('ab.intake')}: ${bdi(COUNTRIES[c].intakes)}</p><button class="link" data-act="aiCountry" data-c="${c}">${icon('bot', 'sm')} ${t('ab.ask', { c: t('c.' + c) })}</button></article>`).join('')}</div></section>
    <section class="wrap sec" id="how"><span class="kick c">${t('how.kick')}</span><h2 class="c">${t('how.t')}</h2><div class="steps">${[1, 2, 3, 4].map(i => `<div class="step"><span class="sn">${bdi(i)}</span><h3>${t('how.' + i)}</h3><p>${t('how.' + i + 's')}</p></div>`).join('')}</div></section>
    <section class="wrap sec about" id="about"><div class="about-img"><img src="${photo('1631304667837-2ea729022c9b', 900)}" alt="" loading="lazy"></div><div><span class="kick">${t('about.kick')}</span><h2>${t('about.t')}</h2><p class="muted">${t('about.p')}</p><ul class="checks">${['b1', 'b2', 'b3'].map(b => `<li>${icon('check')}${t('about.' + b)}</li>`).join('')}</ul></div></section>
    <section class="wrap sec" id="contact"><div class="contact"><div><span class="kick">${t('contact.kick')}</span><h2>${t('contact.t')}</h2><p class="muted">${t('contact.s')}</p><a class="btn wa" href="https://wa.me/${WA_AGENCY}?text=${encodeURIComponent('Hi, I saw the EduBridge demo and want it for my consultancy.')}" target="_blank" rel="noopener">${icon('whatsapp')} ${t('contact.wa')}</a></div>
      <form class="form" data-form="contact" novalidate><label>${t('start.name')}<input name="name" required maxlength="80"></label><label>${t('start.email')}<input name="email" type="email" required maxlength="120"></label><label>${t('contact.msg')}<textarea name="message" rows="3" maxlength="800"></textarea></label><button class="btn org" type="submit">${t('contact.send')} ${icon('send', 'flip')}</button></form></div></section>
    </main>
    <footer class="lfoot"><div class="wrap lfoot-in">${logo()}<div><p>${t('foot.by')}</p><small>${t('foot.note')} · ${t('foot.photos')}</small></div><small>© <bdi>2026</bdi> AI Digital Marketing</small></div></footer>`;
  }

  /* ================= AI ADVISER (WhatsApp-style) ================= */
  const CHAT = { open: false, items: [], ctx: {}, mode: null, busy: false, hist: [], unis: [] };
  function botSay(text, extra) { CHAT.items.push(Object.assign({ who: 'bot', text, at: Date.now() }, extra || {})); }
  function userSay(text) { CHAT.items.push({ who: 'me', text, at: Date.now() }); CHAT.hist.push({ role: 'user', text }); }
  function chatInit() { if (!CHAT.items.length) botSay(t('ai.hello'), { chips: 'country' }); }
  function chipsHtml(kind) {
    if (kind === 'country') return `<div class="wchips">${Object.keys(COUNTRIES).map(c => `<button data-act="aiCountry" data-c="${c}">${flag(c, 'sm')}${t('c.' + c)}</button>`).join('')}</div>`;
    if (kind === 'level') return `<div class="wchips lv">${['ug', 'pg', 'dip'].map(l => `<button data-act="aiLevel" data-l="${l}" class="${CHAT.ctx.level === l ? 'on' : ''}">${t('lvl.' + l)}</button>`).join('')}</div>`;
    return '';
  }
  function uniCard(u) { return `<div class="wuni"><img src="${photo(u.photo, 300, 200)}" alt="" loading="lazy"><div><b>${esc(uniName(u))}</b>${u.popular ? `<span class="tag">${t('ai.topRanked')}</span>` : ''}<small>${icon('check', 'sm')} ${t('f.' + (CHAT.ctx.field || u.fields[0]))} · ${t('lvl.' + (CHAT.ctx.level && u.levels.includes(CHAT.ctx.level) ? CHAT.ctx.level : u.levels[0]))}</small>${u.schol ? `<small>${icon('check', 'sm')} ${t('ai.schol')}</small>` : ''}<small>${flag(u.c, 'xs')} ${esc(u.city)} · ~${sarH(u.fee, true)}${t('ab.yr')}</small></div></div>`; }
  function eligCard(r) { return `<div class="welig ${r.result}"><div class="ring" style="--p:${r.score}"><b>${bdi(r.score)}</b></div><div><b>${t('el.' + r.result)}</b><ul>${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${r.next && r.next.length ? `<small>${t('el.next')}:</small><ul>${r.next.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div>`; }
  function chatMsgs() {
    const last = CHAT.items.length - 1;
    return CHAT.items.map((m, i) => `<div class="wm ${m.who}">${m.live ? `<span class="livebadge">${t('ai.live')}</span>` : ''}<p>${m.flagC ? flag(m.flagC, 'xs') + ' ' : ''}${esc(m.text)}</p>
      ${m.fields ? `<div class="wfields">${FIELD_KEYS.map(f => `<button class="wfield ${CHAT.ctx.field === f ? 'on' : ''}" data-act="aiField" data-f="${f}"><img src="${photo(FIELDS[f].photo, 240, 180)}" alt="" loading="lazy"><span>${t('f.' + f)}</span></button>`).join('')}</div>` : ''}
      ${m.unis && m.unis.length ? `<div class="wunis">${m.unis.map(id => uniCard(uni(id))).join('')}</div>` : ''}
      ${m.elig ? eligCard(m.elig) : ''}
      <small class="wt">${bdi(timeF(m.at))}${m.who === 'me' ? ' ' + icon('checks', 'tick') : ''}</small></div>${i === last && m.chips ? chipsHtml(m.chips) : ''}`).join('') + (CHAT.busy ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : '');
  }
  function chatWidget() {
    chatInit();
    return `<button class="aifab ${CHAT.open ? 'hide' : ''}" data-act="openAI" aria-label="${t('ai.open')}">${icon('whatsapp')}<span>${t('ai.open')}</span></button>
    <section class="wpanel ${CHAT.open ? 'open' : ''}" aria-label="${t('ai.name')}"><header><button class="ibtn ghost-w" data-act="closeAI" aria-label="${t('common.close')}">${icon('chevLeft', 'flip')}</button><span class="wav">${icon('capFill')}</span><div><b>${t('ai.name')} ${icon('verified', 'vf')}</b><small>${t('ai.online')}</small></div><button class="ibtn ghost-w" data-act="aiReset" aria-label="restart">${icon('refresh')}</button></header>
      <div class="wbody" id="wbody">${chatMsgs()}</div>
      <form class="wcomp" data-form="ai"><span class="wi">${icon('smile')}</span><input name="q" maxlength="400" autocomplete="off" placeholder="${t('ai.ph')}" aria-label="${t('ai.ph')}"><span class="wi">${icon('clip')}</span><button class="wsend" type="submit" aria-label="${t('common.send')}" ${CHAT.busy ? 'disabled' : ''}>${icon('send', 'flip')}</button></form>
      <div class="wacts"><button data-act="aiElig">${icon('cap')}<span>${t('ai.btnElig')}</span></button><button data-act="aiFee">${icon('doc')}<span>${t('ai.btnFee')}</span></button><button data-act="aiTalk">${icon('users')}<span>${t('ai.btnTalk')}</span></button></div></section>`;
  }
  function renderChat() { const w = $('#aiw'); if (!w) return; w.innerHTML = chatWidget(); const b = $('#wbody'); if (b) b.scrollTop = b.scrollHeight; }
  function openChat() { CHAT.open = true; renderChat(); }
  function currentUnis() {
    const c = CHAT.ctx; let list = UNIS.filter(u => (!c.country || u.c === c.country) && (!c.field || u.fields.includes(c.field)) && (!c.level || u.levels.includes(c.level)));
    if (!list.length) list = UNIS.filter(u => (!c.country || u.c === c.country) && (!c.field || u.fields.includes(c.field)));
    if (!list.length) list = UNIS.filter(u => !c.country || u.c === c.country);
    if (!list.length) list = UNIS.filter(u => !c.field || u.fields.includes(c.field));
    return list.sort((a, b) => b.popular - a.popular).slice(0, 4);
  }
  function stepCountry(c, silent) { CHAT.ctx.country = c; if (!silent) userSay(t('c.' + c)); botSay(t('ai.great', { flag: '' }).replace('  ', ' '), { chips: 'level', flagC: c }); }
  function stepLevel(l, silent) { CHAT.ctx.level = l; if (!silent) userSay(t('lvl.' + l)); botSay(t('ai.field'), { fields: true }); }
  function stepField(f, silent) {
    CHAT.ctx.field = f; if (!silent) userSay(t('f.' + f));
    if (!CHAT.ctx.country) { botSay(t('ai.askCountry'), { chips: 'country' }); return; }
    const list = currentUnis(); CHAT.unis = list.map(u => u.id);
    const exact = list.some(u => u.c === CHAT.ctx.country && u.fields.includes(f));
    botSay(exact ? t('ai.unis', { c: t('c.' + CHAT.ctx.country), f: t('f.' + f) }) : t('ai.none'), { unis: CHAT.unis });
    botSay(t('ai.after'));
  }
  function advance(x) { // apply extracted choices in order
    const c = CHAT.ctx; let moved = false;
    if (x.country && x.country !== c.country) { c.country = x.country; moved = true; }
    if (x.level) { c.level = x.level; moved = true; }
    if (x.field) { c.field = x.field; moved = true; }
    if (!moved) return false;
    if (!c.level) botSay(t('ai.great', { flag: '' }).replace('  ', ' '), { chips: 'level', flagC: c.country });
    else if (!c.field) botSay(t('ai.field'), { fields: true });
    else stepField(c.field, true);
    return true;
  }
  async function handleText(text) {
    if (CHAT.busy || !text.trim()) return;
    userSay(text.trim()); const x = AI.extract(text);
    Object.assign(CHAT.ctx, x.grade != null ? { grade: x.grade } : {}, x.ielts != null ? { ielts: x.ielts } : {}, x.budget ? { budget: x.budget } : {}, x.phone ? { phone: x.phone } : {}, x.name ? { name: x.name } : {});
    if (CHAT.ctx.name && CHAT.ctx.phone && !CHAT.ctx.saved) { captureLead(); renderChat(); return; }
    if (CHAT.mode === 'elig' && (x.grade != null || x.ielts != null || x.budget)) { CHAT.mode = null; await runElig(); return; }
    if (CHAT.mode === 'contact' && (x.name || x.phone)) { botSay(t('ai.counsellor')); renderChat(); return; }
    if (advance(x)) { renderChat(); return; }
    CHAT.busy = true; renderChat();
    const list = CHAT.unis.length ? CHAT.unis.map(uni) : currentUnis();
    const r = await AI.adviserFree(CHAT.hist, CHAT.ctx, list.length ? list : UNIS, L());
    CHAT.busy = false; CHAT.hist.push({ role: 'model', text: r.reply });
    botSay(r.reply, { live: r.live, unis: r.unis });
    if (r.lead && r.lead.name && (r.lead.phone || CHAT.ctx.phone) && !CHAT.ctx.saved) { CHAT.ctx.name = r.lead.name; CHAT.ctx.phone = r.lead.phone || CHAT.ctx.phone; captureLead(); }
    renderChat();
  }
  async function runElig() {
    CHAT.busy = true; renderChat();
    const list = CHAT.unis.length ? CHAT.unis.map(uni) : currentUnis();
    const r = await AI.eligibility(CHAT.ctx, list, L());
    CHAT.busy = false; botSay(t('el.' + r.result), { elig: r, live: r.live }); botSay(t('ai.counsellor')); CHAT.mode = 'contact'; renderChat();
  }
  function captureLead() {
    const c = CHAT.ctx; c.saved = true;
    const e = addEnquiry({ name: { en: c.name, ar: c.name }, phone: c.phone, source: 'aichat', country: c.country || 'uk', level: c.level || 'ug', field: c.field || 'cs', uniId: CHAT.unis[0] || null, grade: c.grade ?? null, ielts: c.ielts ?? null, budget: c.budget || 0, notes: 'AI Adviser chat: ' + CHAT.hist.filter(h => h.role === 'user').map(h => h.text).join(' | ').slice(0, 400) });
    botSay(t('ai.done', { name: c.name })); toast(t('ai.enqAdded', { name: c.name }));
    if (route().app) render();
    return e;
  }

  /* ================= CRM SHELL ================= */
  const NAVI = { dashboard: 'home', enquiries: 'doc', students: 'users', applications: 'filePlus', counsellors: 'user', universities: 'uni', courses: 'book', followups: 'phone', tasks: 'checkSq', whatsapp: 'whatsapp', reports: 'chart', settings: 'settings' };
  function shell(page, content) {
    const unread = D.notifs.filter(n => !n.read).length, wa = D.chats.reduce((a, c) => a + (c.unread || 0), 0);
    return `<div class="app ${UI.sidebar ? 'sb-open' : ''}"><aside class="side">${logo(true)}<nav>${Object.keys(NAVI).map(p => `<a href="#/app/${p}" class="${p === page ? 'on' : ''}" data-act="nav">${icon(NAVI[p])}<span>${t('side.' + p)}</span>${p === 'whatsapp' && wa ? `<em>${wa}</em>` : ''}</a>`).join('')}</nav>
      <div class="side-foot"><a class="sfl" href="#/">${icon('globe')} ${t('top.site')}</a><span class="demo-tag"><i class="live"></i>${t('top.demo')}</span></div></aside><div class="sb-back" data-act="sidebar"></div>
      <div class="main"><header class="top"><button class="ibtn show-md" data-act="sidebar" aria-label="${t('common.menu')}">${icon('menu')}</button>
        <div class="search" id="gsearch">${icon('search')}<input type="search" placeholder="${t('top.search')}" data-act="gsearch" aria-label="${t('common.search')}" autocomplete="off"><div class="sres" id="sres"></div></div>
        <div class="tacts">${langMenu('lang-a')}<button class="ibtn" data-act="theme" aria-label="${t('theme.toggle')}">${icon(PREFS.theme === 'dark' ? 'sun' : 'moon')}</button>
          <div class="dd ${UI.menus === 'notif' ? 'open' : ''}"><button class="ibtn" data-act="menu" data-id="notif" aria-label="${t('top.notif')}">${icon('bell')}${unread ? `<em class="dot">${unread}</em>` : ''}</button><div class="ddm wide"><div class="ddh"><b>${t('top.notif')}</b><button class="link" data-act="markRead">${t('top.markread')}</button></div>${D.notifs.slice(0, 8).map(n => `<div class="nitem ${n.read ? '' : 'unread'}">${icon('bell')}<div><p>${esc(t(n.k, nv(n.v)))}</p><small>${rel(n.at)}</small></div></div>`).join('')}</div></div>
          <div class="dd ${UI.menus === 'user' ? 'open' : ''}"><button class="ubtn" data-act="menu" data-id="user">${avatar({ en: userName() })}<span class="hide-sm"><b>${bdi(userName())}</b><small>${t('top.role')}</small></span>${icon('chevDown', 'sm')}</button><div class="ddm"><a href="#/app/settings" data-act="nav">${icon('settings')}${t('side.settings')}</a><a href="#/">${icon('globe')}${t('top.site')}</a><button data-act="reset">${icon('refresh')}${t('top.reset')}</button><button data-act="logout">${icon('logout')}${t('top.logout')}</button></div></div></div></header>
        <main class="content" id="content">${content}</main></div></div>`;
  }
  function nv(v) { const o = {}; for (const k in v) o[k] = k === 'src' ? t(v[k]) : nm(v[k]); return o; }
  const head = (title, sub, acts) => `<div class="phead"><div><h1>${title}</h1><p class="muted">${sub}</p></div><div class="pacts">${acts || ''}</div></div>`;

  /* ================= DASHBOARD ================= */
  function kpis() {
    const now = Date.now(), M = 30 * 864e5;
    const inR = (ts, a, b) => ts >= now - a && ts < now - b; const pct = (a, b) => b ? Math.round((a - b) / b * 100) : 100;
    const e1 = D.enquiries.filter(e => inR(e.created, M, 0)).length, e0 = D.enquiries.filter(e => inR(e.created, 2 * M, M)).length;
    const active = D.enquiries.filter(e => ['new', 'contacted', 'followup'].includes(e.status)).length;
    const conv = D.enquiries.filter(e => e.status === 'converted');
    const conv30 = conv.filter(e => inR(e.created, 3 * M, 0)).length;
    const fu = D.followups.filter(f => !f.done).length;
    return [
      { k: 'kpi.enq', v: bdi(numF.format(D.enquiries.length)), d: pct(e1, e0), ic: 'users', c: '#16a34a' },
      { k: 'kpi.leads', v: bdi(numF.format(active)), d: 8, ic: 'target', c: '#ef4444' },
      { k: 'kpi.apps', v: bdi(numF.format(D.applications.length)), d: 18, ic: 'doc', c: '#2563eb' },
      { k: 'kpi.conv', v: bdi(numF.format(conv.length)), d: 15, ic: 'trophy', c: '#f59e0b' },
      { k: 'kpi.rev', v: sarH(conv30 * 4950), d: 22, ic: 'chart', c: '#3b82f6' },
      { k: 'kpi.fu', v: bdi(numF.format(fu)), d: -5, ic: 'alarm', c: '#f97316' },
    ];
  }
  const kpiCard = k => `<div class="kpi card"><span class="kic" style="--c:${k.c}">${icon(k.ic)}</span><div><small>${t(k.k)}</small><b>${k.v}</b><span class="dl ${k.d < 0 ? 'neg' : ''}">${k.d < 0 ? '' : '+'}${bdi(k.d + '%')}</span></div></div>`;
  function rangeFilter(e) { const now = Date.now(); if (UI.src === 'month') return e.created > now - 30 * 864e5; if (UI.src === 'q') return e.created > now - 90 * 864e5; if (UI.src === 'year') return new Date(e.created).getFullYear() === new Date().getFullYear(); return true; }
  function donutCard() {
    const list = D.enquiries.filter(rangeFilter); const cnt = {}; list.forEach(e => cnt[e.source] = (cnt[e.source] || 0) + 1);
    const segs = ['website', 'whatsapp', 'facebook', 'instagram', 'referral', 'aichat'].filter(s => cnt[s]).map(s => ({ value: cnt[s], color: SRC_C[s], label: t('src.' + s) }));
    const tot = list.length || 1;
    return `<div class="ch"><h4>${t('dash.source')}</h4><select class="chip" data-act="srcRange" aria-label="range">${['month', 'q', 'year', 'all'].map(r => `<option value="${r}" ${UI.src === r ? 'selected' : ''}>${t('range.' + r)}</option>`).join('')}</select></div>
      <div class="donut-wrap">${Charts.donut(segs, numF.format(list.length), t('dash.total'))}<ul class="legend">${segs.map(s => `<li><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${bdi(Math.round(s.value / tot * 100) + '%')}</b></li>`).join('')}</ul></div>`;
  }
  function recentTable(n) {
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="cbc"><span class="cbx"></span></th><th>${t('col.name')}</th><th class="hide-sm">${t('col.course')}</th><th class="hide-sm">${t('col.source')}</th><th>${t('col.status')}</th><th class="hide-xs">${t('col.date')}</th></tr></thead><tbody>
      ${D.enquiries.slice(0, n).map(e => `<tr data-act="enq" data-id="${e.id}"><td class="cbc"><span class="cbx"></span></td><td><span class="who">${avatar(e.name, 'sm')}<span>${esc(nm(e.name))}</span></span></td><td class="hide-sm">${t('f.' + e.field)}</td><td class="hide-sm">${esc(t('src.' + e.source))}</td><td>${stTag(e.status)}</td><td class="nowrap hide-xs">${dateF(e.created)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function trend() {
    const y = new Date().getFullYear(), m = new Date().getMonth(); const items = [];
    for (let i = 0; i <= m; i++) { const s = new Date(y, i, 1).getTime(), e = new Date(y, i + 1, 1).getTime(); const list = D.enquiries.filter(q => q.created >= s && q.created < e); items.push({ label: new Intl.DateTimeFormat(I18N.locale(), { month: 'short' }).format(new Date(y, i, 1)), a: list.length, b: list.filter(q => q.status === 'converted').length }); }
    return Charts.stacked(items.slice(-8));
  }
  function topCourses() {
    const cnt = {}; D.enquiries.forEach(e => cnt[e.field] = (cnt[e.field] || 0) + 1);
    const arr = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5); const max = arr[0] ? arr[0][1] : 1;
    return `<ul class="hbars">${arr.map(([f, n]) => `<li><span>${t('f.' + f)}</span><div class="hb"><i style="width:${n / max * 100}%"></i></div><b>${bdi(n)}</b></li>`).join('')}</ul>`;
  }
  function pgDashboard() {
    return head(t('dash.hi', { name: '<bdi>' + esc(userName().split(' ')[0]) + '</bdi>' }), t('dash.his'), `<button class="btn ghost" data-act="openAI">${icon('bot')} ${t('ai.name')}</button>`)
      + `<div class="kpis six">${kpis().map(kpiCard).join('')}</div>
      <div class="grid2"><div class="card">${donutCard()}</div><div class="card"><div class="ch"><h4>${t('dash.quick')}</h4></div><div class="qa">
        <button class="qa1" data-act="addEnq">${icon('userPlus')} ${t('qa.enq')}</button><button data-act="addApp">${icon('filePlus')} ${t('qa.app')}</button><button data-act="goWa">${icon('whatsapp')} ${t('qa.wa')}</button><button data-act="assignModal">${icon('user')} ${t('qa.assign')}</button></div></div></div>
      <div class="card mb"><div class="ch"><h4>${t('dash.recent')}</h4><a class="link" href="#/app/enquiries" data-act="nav">${t('dash.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div>${recentTable(5)}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('dash.trend')}</h4><span class="chip">${t('range.year')}</span></div>${trend()}<p class="leg2"><i class="la"></i>${t('leg.enq')} <i class="lb"></i>${t('leg.conv')}</p></div><div class="card"><div class="ch"><h4>${t('dash.top')}</h4></div>${topCourses()}</div></div>`;
  }

  /* ================= ENQUIRIES ================= */
  function filtered() {
    const q = UI.ef.q.trim().toLowerCase();
    return D.enquiries.filter(e => (!UI.ef.st || e.status === UI.ef.st) && (!UI.ef.src || e.source === UI.ef.src) && (!UI.ef.c || e.country === UI.ef.c) && (!q || e.name.en.toLowerCase().includes(q) || (e.name.ar || '').includes(q) || e.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))));
  }
  function pgEnquiries() {
    const all = filtered(), list = all.slice(0, UI.page * 15), tabs = ['', 'new', 'contacted', 'followup', 'converted', 'lost'];
    return head(t('enq.title'), t('enq.sub'), `<button class="btn ghost" data-act="export">${icon('download')} ${t('enq.export')}</button><button class="btn org" data-act="addEnq">${icon('plus')} ${t('enq.add')}</button>`)
      + `<div class="tabs">${tabs.map(s => `<button class="${UI.ef.st === s ? 'on' : ''}" data-act="ef" data-k="st" data-v="${s}">${s ? t('st.' + s) : t('enq.all')} <em>${bdi(s ? D.enquiries.filter(e => e.status === s).length : D.enquiries.length)}</em></button>`).join('')}</div>
      <div class="card"><div class="filters"><div class="search inline">${icon('search')}<input type="search" value="${esc(UI.ef.q)}" placeholder="${t('common.search')}..." data-act="eq" aria-label="${t('common.search')}"></div>
        <select data-act="esel" data-k="src" aria-label="${t('col.source')}"><option value="">${t('enq.allSrc')}</option>${['website', 'whatsapp', 'facebook', 'instagram', 'referral', 'aichat'].map(s => `<option value="${s}" ${UI.ef.src === s ? 'selected' : ''}>${t('src.' + s)}</option>`).join('')}</select>
        <select data-act="esel" data-k="c" aria-label="${t('col.country')}"><option value="">${t('enq.allC')}</option>${Object.keys(COUNTRIES).map(c => `<option value="${c}" ${UI.ef.c === c ? 'selected' : ''}>${t('c.' + c)}</option>`).join('')}</select></div>
      <div class="tbl-wrap"><table class="tbl hover"><thead><tr><th>${t('col.name')}</th><th class="hide-sm">${t('col.phone')}</th><th>${t('col.country')}</th><th class="hide-md">${t('col.course')}</th><th class="hide-md">${t('col.level')}</th><th class="hide-sm">${t('col.source')}</th><th>${t('col.status')}</th><th class="hide-md">${t('col.counsellor')}</th><th class="hide-sm">${t('col.date')}</th></tr></thead><tbody>
      ${list.map(e => `<tr data-act="enq" data-id="${e.id}"><td><span class="who">${avatar(e.name, 'sm')}<span>${esc(nm(e.name))}</span></span></td><td class="hide-sm nowrap">${bdi(e.phone)}</td><td class="nowrap">${flag(e.country, 'xs')} ${t('c.' + e.country)}</td><td class="hide-md">${t('f.' + e.field)}</td><td class="hide-md">${t('lvl.' + e.level)}</td><td class="hide-sm">${srcTag(e.source)}</td><td>${stTag(e.status)}</td><td class="hide-md">${e.counsellor ? esc(nm(csl(e.counsellor).name)) : `<span class="muted">${t('enq.unassigned')}</span>`}</td><td class="hide-sm nowrap">${dateF(e.created)}</td></tr>`).join('')}</tbody></table>
      ${!all.length ? `<p class="empty">${t('enq.empty')}</p>` : ''}</div>${all.length > list.length ? `<div class="center"><button class="btn ghost" data-act="more">${t('enq.more')} (${bdi(all.length - list.length)})</button></div>` : ''}</div>`;
  }
  function enqForm(e) {
    e = e || { name: { en: '' }, phone: '', email: '', source: 'website', status: 'new', country: 'uk', level: 'ug', field: 'cs', grade: '', ielts: '', budget: '', notes: '' };
    const opt = (arr, cur, pre) => arr.map(x => `<option value="${x}" ${cur === x ? 'selected' : ''}>${t(pre + x)}</option>`).join('');
    return `<form class="form" data-form="enq" data-id="${e.id || ''}" novalidate>
      <div class="row2"><label>${t('col.name')} *<input name="name" required maxlength="60" value="${esc(nm(e.name))}"></label><label>${t('col.phone')} *<input name="phone" required maxlength="25" inputmode="tel" value="${esc(e.phone)}" placeholder="+966 5x xxx xxxx / +92 3xx xxxxxxx"></label></div>
      <div class="row3"><label>${t('col.country')}<select name="country">${opt(Object.keys(COUNTRIES), e.country, 'c.')}</select></label><label>${t('col.level')}<select name="level">${opt(['ug', 'pg', 'dip'], e.level, 'lvl.')}</select></label><label>${t('col.course')}<select name="field">${opt(FIELD_KEYS, e.field, 'f.')}</select></label></div>
      <div class="row3"><label>${t('col.grade')} (%)<input name="grade" type="number" min="0" max="100" value="${e.grade ?? ''}"></label><label>${t('col.ielts')}<input name="ielts" type="number" min="0" max="9" step="0.5" value="${e.ielts ?? ''}"></label><label>${t('col.budget')} (SAR)<input name="budget" type="number" min="0" step="1000" value="${e.budget || ''}"></label></div>
      <div class="row2"><label>${t('col.source')}<select name="source">${opt(['website', 'whatsapp', 'facebook', 'instagram', 'referral', 'aichat'], e.source, 'src.')}</select></label><label>${t('col.status')}<select name="status">${opt(SEED.STATUSES, e.status, 'st.')}</select></label></div>
      <label>${t('enq.notes')}<textarea name="notes" rows="2" maxlength="500">${esc(e.notes)}</textarea></label>
      <div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('common.cancel')}</button><button class="btn org" type="submit">${t('common.save')}</button></div></form>`;
  }
  function enqDrawer(id) {
    const e = enq(id); if (!e) return; const u = uni(e.uniId);
    drawer(`<div class="dh">${avatar(e.name, 'lg')}<div><h3>${esc(nm(e.name))}</h3><p>${stTag(e.status)} ${srcTag(e.source)}</p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('common.close')}">${icon('x')}</button></div>
      <div class="dbody"><dl class="info"><div><dt>${t('col.phone')}</dt><dd>${bdi(e.phone)}</dd></div><div><dt>${t('col.country')}</dt><dd>${flag(e.country, 'xs')} ${t('c.' + e.country)}</dd></div><div><dt>${t('col.course')}</dt><dd>${t('f.' + e.field)} · ${t('lvl.' + e.level)}</dd></div><div><dt>${t('col.uni')}</dt><dd>${esc(uniName(u))}</dd></div><div><dt>${t('col.grade')}</dt><dd>${e.grade != null ? bdi(e.grade + '%') : '—'}</dd></div><div><dt>${t('col.ielts')}</dt><dd>${e.ielts ? bdi(e.ielts) : '—'}</dd></div><div><dt>${t('col.budget')}</dt><dd>${e.budget ? sarH(e.budget) : '—'}</dd></div><div><dt>${t('enq.created')}</dt><dd>${dateF(e.created)}</dd></div></dl>
        <label>${t('enq.assign')}<select data-act="assign" data-id="${e.id}"><option value="">${t('enq.unassigned')}</option>${COUNSELLORS.map(c => `<option value="${c.id}" ${e.counsellor === c.id ? 'selected' : ''}>${esc(nm(c.name))} (${c.langs})</option>`).join('')}</select></label>
        ${e.notes ? `<p class="note">${esc(e.notes)}</p>` : ''}
        <div class="aibox"><div class="ch"><h4>${icon('sparkles')} ${t('enq.ai')}</h4></div><div id="aiEl">${e.ai ? eligCard(e.ai) + (e.ai.live ? `<span class="livebadge">${t('ai.live')}</span>` : '') : `<button class="btn ghost block" data-act="elig" data-id="${e.id}">${icon('cap')} ${t('enq.elig')}</button>`}</div>
          <button class="btn grn block" data-act="follow" data-id="${e.id}">${icon('whatsapp')} ${t('enq.follow')}</button><div id="aiFollow"></div></div>
        <div class="dacts"><button class="btn ghost" data-act="toApp" data-id="${e.id}">${icon('filePlus')} ${t('enq.toApp')}</button><button class="btn ghost" data-act="editEnq" data-id="${e.id}">${icon('edit')} ${t('common.edit')}</button><button class="btn danger" data-act="delEnq" data-id="${e.id}">${icon('trash')} ${t('common.delete')}</button></div></div>`);
  }

  /* ================= OTHER PAGES ================= */
  function pgStudents() {
    const list = D.enquiries.filter(e => e.status === 'converted');
    return head(t('stu.title'), t('stu.sub'), '') + `<div class="cards3">${list.map(e => { const a = D.applications.find(x => x.enqId === e.id); const u = uni(a ? a.uniId : e.uniId); return `<article class="card stu" data-act="enq" data-id="${e.id}"><div class="cc-top">${avatar(e.name, 'lg')}<div><h3>${esc(nm(e.name))}</h3><p class="muted sm">${t('f.' + e.field)} · ${t('lvl.' + e.level)}</p></div></div>
      <dl class="info"><div><dt>${t('stu.uni')}</dt><dd>${flag(e.country, 'xs')} ${esc(uniName(u))}</dd></div><div><dt>${t('col.stage')}</dt><dd>${a ? stgTag(a.stage) : '—'}</dd></div><div><dt>${t('col.counsellor')}</dt><dd>${e.counsellor ? esc(nm(csl(e.counsellor).name)) : '—'}</dd></div><div><dt>${t('stu.since')}</dt><dd>${dateF(e.created, { month: 'short', year: 'numeric' })}</dd></div></dl></article>`; }).join('')}</div>`;
  }
  const STAGE_C = { docs: '#64748b', applied: '#2563eb', offer: '#f59e0b', visa: '#8b5cf6', enrolled: '#16a34a', rejected: '#ef4444' };
  function pgApplications() {
    return head(t('app.title'), t('app.sub'), `<button class="btn org" data-act="addApp">${icon('plus')} ${t('app.add')}</button>`) + `<p class="hint">${icon('grip', 'sm')} ${t('app.drag')}</p><div class="kanban" id="kanban">${STAGES.map(s => { const as = D.applications.filter(a => a.stage === s); return `<section class="kcol" data-stage="${s}" style="--c:${STAGE_C[s]}"><header><b>${t('stg.' + s)}</b><em>${bdi(as.length)}</em></header><div class="kbody">${as.map(a => { const u = uni(a.uniId); return `<div class="kcard" data-app="${a.id}" tabindex="0"><span class="grip" aria-hidden="true">${icon('grip')}</span><div class="kc-top">${avatar(a.name, 'sm')}<b>${esc(nm(a.name))}</b></div><p class="sm">${u ? flag(u.c, 'xs') : ''} ${esc(uniName(u))}</p><p class="muted sm">${t('f.' + a.field)} · ${t('lvl.' + a.level)}</p><div class="kc-foot"><small>${t('app.intake')}: ${bdi(a.intake)}</small></div><select class="kmove" data-act="moveApp" data-id="${a.id}" aria-label="stage">${STAGES.map(x => `<option value="${x}" ${x === s ? 'selected' : ''}>${t('stg.' + x)}</option>`).join('')}</select></div>`; }).join('')}</div></section>`; }).join('')}</div>`;
  }
  function moveApp(id, stage) {
    const a = D.applications.find(x => x.id === id); if (!a || a.stage === stage) return; a.stage = stage; a.updated = Date.now();
    const e = enq(a.enqId); if (e && ['offer', 'visa', 'enrolled'].includes(stage)) e.status = 'converted';
    save(); toast(stage === 'enrolled' ? t('app.enrolled') : t('app.moved', { stage: t('stg.' + stage) })); render();
  }
  function initDrag() {
    const kb = $('#kanban'); if (!kb) return; let drag = null;
    kb.addEventListener('pointerdown', e => { const card = e.target.closest('.kcard'); if (!card || e.target.closest('select,button')) return; if (e.pointerType !== 'mouse' && !e.target.closest('.grip')) return; drag = { card, id: card.dataset.app, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId }; });
    window.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      if (!drag.on) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return; drag.on = true; const r = drag.card.getBoundingClientRect(); drag.ox = e.clientX - r.left; drag.oy = e.clientY - r.top; drag.ghost = drag.card.cloneNode(true); drag.ghost.classList.add('ghost'); drag.ghost.style.width = r.width + 'px'; document.body.appendChild(drag.ghost); drag.card.classList.add('dragging'); document.body.classList.add('dragmode'); }
      e.preventDefault(); drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px,${e.clientY - drag.oy}px) rotate(2deg)`;
      const el = document.elementFromPoint(e.clientX, e.clientY), col = el && el.closest('.kcol'); $$('.kcol').forEach(c => c.classList.toggle('over', c === col)); drag.col = col;
      const kr = kb.getBoundingClientRect(); if (e.clientX < kr.left + 40) kb.scrollLeft -= 12; else if (e.clientX > kr.right - 40) kb.scrollLeft += 12;
    }, { passive: false });
    const end = () => { if (!drag) return; const d = drag; drag = null; document.body.classList.remove('dragmode'); if (!d.on) return; d.ghost.remove(); d.card.classList.remove('dragging'); $$('.kcol').forEach(c => c.classList.remove('over')); if (d.col) moveApp(d.id, d.col.dataset.stage); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }
  function appForm(preId) {
    const pool = D.enquiries.filter(e => e.status !== 'lost').slice(0, 60);
    return `<form class="form" data-form="app" novalidate><label>${t('app.student')}<select name="enqId">${pool.map(e => `<option value="${e.id}" ${e.id === preId ? 'selected' : ''}>${esc(nm(e.name))} — ${t('f.' + e.field)}</option>`).join('')}</select></label>
      <div class="row2"><label>${t('col.uni')}<select name="uniId">${UNIS.map(u => `<option value="${u.id}">${esc(uniName(u))} (${t('c.' + u.c)})</option>`).join('')}</select></label><label>${t('app.intake')}<select name="intake"><option>Jan 2027</option><option>Feb 2027</option><option>Sep 2027</option></select></label></div>
      <div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('common.cancel')}</button><button class="btn org" type="submit">${t('common.save')}</button></div></form>`;
  }
  function pgCounsellors() {
    return head(t('cs.title'), t('cs.sub'), `<button class="btn org" data-act="assignModal">${icon('user')} ${t('qa.assign')}</button>`) + `<div class="cards3">${COUNSELLORS.map(c => { const mine = D.enquiries.filter(e => e.counsellor === c.id), conv = mine.filter(e => e.status === 'converted').length; const rate = mine.length ? Math.round(conv / mine.length * 100) : 0; return `<article class="card cs"><div class="cc-top">${avatar(c.name, 'lg')}<div><h3>${esc(nm(c.name))}</h3><p class="muted sm">${t('cs.lang')}: ${bdi(c.langs)}</p></div></div>
      <div class="stats3"><div><b>${bdi(mine.length)}</b><small>${t('cs.assigned')}</small></div><div><b>${bdi(conv)}</b><small>${t('cs.conv')}</small></div><div><b>${bdi(rate + '%')}</b><small>${t('cs.rate')}</small></div></div>
      <p class="sm">${t('cs.countries')}: ${c.cs.map(x => flag(x, 'xs') + ' ' + t('c.' + x)).join(' · ')}</p>
      <ul class="mini-list">${mine.slice(0, 3).map(e => `<li data-act="enq" data-id="${e.id}">${avatar(e.name, 'sm')}<span>${esc(nm(e.name))}</span>${stTag(e.status)}</li>`).join('')}</ul></article>`; }).join('')}</div>`;
  }
  function pgUniversities() {
    return head(t('uni.title'), t('uni.sub'), '') + `<div class="ugrid">${UNIS.map(u => `<article class="card ucard"><div class="uimg"><img src="${photo(u.photo, 600, 360)}" alt="" loading="lazy">${u.popular ? `<span class="tag">${t('uni.popular')}</span>` : ''}</div><div class="ub"><h3>${esc(uniName(u))}</h3><p class="muted sm">${flag(u.c, 'xs')} ${esc(u.city)}, ${t('c.' + u.c)}</p>
      <dl class="info three"><div><dt>${t('col.fee')}</dt><dd>~${sarH(u.fee, true)}</dd></div><div><dt>${t('uni.min')}</dt><dd>${bdi(u.grade + '%')}</dd></div><div><dt>${t('uni.ielts')}</dt><dd>${bdi(u.ielts)}</dd></div></dl>
      <div class="chips">${u.fields.map(f => `<span>${t('f.' + f)}</span>`).join('')}</div><button class="btn ghost sm" data-act="uniAsk" data-id="${u.id}">${icon('bot')} ${t('uni.ask')}</button></div></article>`).join('')}</div>`;
  }
  function pgCourses() {
    return head(t('crs2.title'), t('crs2.sub'), '') + `<div class="ugrid">${FIELD_KEYS.map(f => { const es = D.enquiries.filter(e => e.field === f); return `<article class="card ucard"><div class="uimg"><img src="${photo(FIELDS[f].photo, 600, 360)}" alt="" loading="lazy"></div><div class="ub"><h3>${t('f.' + f)}</h3><dl class="info three"><div><dt>${t('col.enq')}</dt><dd>${bdi(es.length)}</dd></div><div><dt>${t('col.unis')}</dt><dd>${bdi(UNIS.filter(u => u.fields.includes(f)).length)}</dd></div><div><dt>${t('kpi.conv')}</dt><dd>${bdi(es.filter(e => e.status === 'converted').length)}</dd></div></dl><button class="btn ghost sm" data-act="aiField" data-f="${f}">${icon('bot')} ${t('uni.ask')}</button></div></article>`; }).join('')}</div>`;
  }
  function pgFollowups() {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const today = t0.getTime();
    const open = D.followups.filter(f => !f.done).sort((a, b) => a.due - b.due);
    const groups = [['overdue', open.filter(f => f.due < Date.now() && f.due < today + 864e5 && f.due < today)], ['today', open.filter(f => f.due >= today && f.due < today + 864e5)], ['upcoming', open.filter(f => f.due >= today + 864e5)]];
    const late = open.filter(f => f.due < today); groups[0][1] = late;
    const chI = { wa: 'whatsapp', call: 'phone', email: 'mail' };
    return head(t('fu.title'), t('fu.sub'), '') + (open.length ? groups.filter(g => g[1].length).map(([k, list]) => `<h4 class="gh ${k}">${t('fu.' + k)} <em>${bdi(list.length)}</em></h4><div class="card"><ul class="fus">${list.map(f => { const e = enq(f.enqId); return e ? `<li class="${k}"><span class="chn">${icon(chI[f.channel])}</span><div data-act="enq" data-id="${e.id}"><b>${esc(nm(e.name))}</b><small>${t('fu.' + f.channel)} · ${t('f.' + e.field)} · ${t('c.' + e.country)}</small></div><small class="nowrap">${dateF(f.due, { day: 'numeric', month: 'short' })}, ${bdi(timeF(f.due))}</small><button class="btn ghost sm" data-act="fuDone" data-id="${f.id}">${icon('check')} ${t('fu.done')}</button></li>` : ''; }).join('')}</ul></div>`).join('') : `<p class="empty">${t('fu.empty')}</p>`);
  }
  function taskText(tk) { return tk.text ? esc(tk.text) : esc(t(tk.k, { name: nm(tk.n), course: tk.f ? t('f.' + tk.f) : '' })); }
  function dueLabel(ts) { const d0 = new Date(); d0.setHours(0, 0, 0, 0); const diff = Math.floor((ts - d0.getTime()) / 864e5); return `${diff === 0 ? t('tasks.today') : diff === 1 ? t('tasks.tomorrow') : dateF(ts, { day: 'numeric', month: 'short' })}, ${bdi(timeF(ts))}`; }
  function pgTasks() {
    const open = D.tasks.filter(x => !x.done).sort((a, b) => a.due - b.due), done = D.tasks.filter(x => x.done), list = UI.tf === 'open' ? open : done;
    return head(t('tasks.title'), t('tasks.sub'), '') + `<form class="addtask card" data-form="task"><input name="text" required maxlength="120" placeholder="${t('tasks.ph')}" aria-label="${t('tasks.ph')}"><select name="when" aria-label="due"><option value="0">${t('tasks.today')}</option><option value="1">${t('tasks.tomorrow')}</option><option value="3">${t('tasks.later')}</option></select><button class="btn org" type="submit">${icon('plus')} <span class="hide-xs">${t('tasks.add')}</span></button></form>
      <div class="tabs"><button class="${UI.tf === 'open' ? 'on' : ''}" data-act="tf" data-v="open">${t('tasks.open')} <em>${bdi(open.length)}</em></button><button class="${UI.tf === 'done' ? 'on' : ''}" data-act="tf" data-v="done">${t('tasks.done')} <em>${bdi(done.length)}</em></button></div>
      <div class="card">${list.length ? `<ul class="tasks">${list.map(tk => `<li class="${tk.done ? 'done' : ''} ${!tk.done && tk.due < Date.now() ? 'late' : ''}"><label class="cb"><input type="checkbox" ${tk.done ? 'checked' : ''} data-act="toggleTask" data-id="${tk.id}"><span></span></label><p>${taskText(tk)}</p><small>${icon('clock', 'sm')} ${dueLabel(tk.due)}</small><button class="ibtn sm" data-act="delTask" data-id="${tk.id}" aria-label="${t('common.delete')}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="empty">${t('tasks.empty')}</p>`}</div>`;
  }
  const msgText = m => m.text != null ? m.text : (m.t[L()] || m.t.en);
  function pgWhatsapp() {
    const sel = D.chats.find(c => c.id === UI.chat); const who = c => enq(c.enqId) || { name: { en: '?' }, phone: '', source: 'website', id: '' };
    return head(t('wa.title'), t('wa.sub'), '') + `<div class="inbox card ${sel ? 'has-sel' : ''}"><div class="ilist">${D.chats.map(c => { const e = who(c), last = c.msgs[c.msgs.length - 1]; return `<button class="ichat ${c.id === UI.chat ? 'on' : ''}" data-act="openChat" data-id="${c.id}">${avatar(e.name)}<div><b>${esc(nm(e.name))}</b><p>${esc(msgText(last)).slice(0, 60)}</p></div><small>${rel(last.at)}</small>${c.unread ? `<em>${bdi(c.unread)}</em>` : ''}</button>`; }).join('')}</div>
      <div class="ithread">${sel ? (() => { const e = who(sel); return `<div class="ith-h"><button class="ibtn show-sm" data-act="closeChat" aria-label="back">${icon('chevLeft', 'flip')}</button>${avatar(e.name)}<div><b>${esc(nm(e.name))}</b><small>${bdi(e.phone)}</small></div><button class="btn ghost sm" data-act="enq" data-id="${e.id}">${icon('user')}</button></div>
        <div class="msgs wa-bg" id="msgs">${sel.msgs.map(m => `<div class="msg ${m.me ? 'me' : ''}">${m.ai ? `<span class="aitag">${icon('bot', 'sm')} AI</span>` : ''}<p>${esc(msgText(m))}</p><small>${bdi(timeF(m.at))}</small></div>`).join('')}</div>
        <form class="mcomp" data-form="msg"><button type="button" class="ibtn" data-act="aiSuggest" title="${t('wa.suggest')}" aria-label="${t('wa.suggest')}">${icon('sparkles')}</button><input name="text" maxlength="600" autocomplete="off" placeholder="${t('wa.type')}" aria-label="${t('wa.type')}"><button class="wsend" type="submit" aria-label="${t('common.send')}">${icon('send', 'flip')}</button></form>`; })() : `<p class="empty big">${icon('whatsapp')}<br>${t('wa.select')}</p>`}</div></div>`;
  }
  function pgReports() {
    const conv = D.enquiries.filter(e => e.status === 'converted').length, rate = Math.round(conv / (D.enquiries.length || 1) * 100);
    const cnt = {}; D.enquiries.forEach(e => cnt[e.country] = (cnt[e.country] || 0) + 1);
    const funnel = STAGES.filter(s => s !== 'rejected').map(s => ({ s, n: D.applications.filter(a => STAGES.indexOf(a.stage) >= STAGES.indexOf(s) && a.stage !== 'rejected').length })); const fm = Math.max(...funnel.map(f => f.n), 1);
    return head(t('rep.title'), t('rep.sub'), `<button class="btn org" data-act="export">${icon('download')} ${t('rep.export')}</button>`)
      + `<div class="kpis">${kpiCard({ k: 'kpi.enq', v: bdi(D.enquiries.length), d: 12, ic: 'users', c: '#16a34a' })}${kpiCard({ k: 'rep.conv', v: bdi(rate + '%'), d: 4, ic: 'trophy', c: '#f59e0b' })}${kpiCard({ k: 'kpi.apps', v: bdi(D.applications.length), d: 18, ic: 'doc', c: '#2563eb' })}${kpiCard({ k: 'rep.resp', v: bdi('< 1 min'), d: 60, ic: 'bot', c: '#0d9488' })}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('rep.monthly')}</h4></div>${trend()}<p class="leg2"><i class="la"></i>${t('leg.enq')} <i class="lb"></i>${t('leg.conv')}</p></div><div class="card"><div class="ch"><h4>${t('rep.funnel')}</h4></div><div class="funnel">${funnel.map(f => `<div><span>${t('stg.' + f.s)}</span><div class="fb"><i style="width:${Math.max(4, f.n / fm * 100)}%;background:${STAGE_C[f.s]}"></i></div><b>${bdi(f.n)}</b></div>`).join('')}</div></div></div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('rep.byCountry')}</h4></div>${Charts.bars(Object.keys(COUNTRIES).map(c => ({ label: t('c.' + c), value: cnt[c] || 0 })))}</div><div class="card">${donutCard()}</div></div>`;
  }
  function pgSettings() {
    return head(t('set.title'), t('set.sub'), '') + `<div class="grid2 set"><form class="card form" data-form="profile"><h4>${t('set.profile')}</h4><label>${t('start.name')}<input name="name" maxlength="60" value="${esc(USER.name)}" required></label><label>${t('start.company')}<input name="company" maxlength="80" value="${esc(USER.company || '')}"></label><label>${t('start.email')}<input value="${esc(USER.email)}" disabled></label><button class="btn org" type="submit">${t('set.save')}</button></form>
      <div class="card"><h4>${t('set.appearance')}</h4><div class="seg"><button class="${PREFS.theme === 'light' ? 'on' : ''}" data-act="setTheme" data-v="light">${icon('sun')} ${t('set.light')}</button><button class="${PREFS.theme === 'dark' ? 'on' : ''}" data-act="setTheme" data-v="dark">${icon('moon')} ${t('set.dark')}</button></div>
        <h4>${t('set.lang')}</h4><div class="seg">${[['en', 'English'], ['ar', 'العربية'], ['ur', 'اردو']].map(l => `<button class="${L() === l[0] ? 'on' : ''}" data-act="lang" data-l="${l[0]}">${l[1]}</button>`).join('')}</div>
        <h4>${t('set.ai')}</h4><p class="aistat ${AI.live ? 'on' : ''}"><i></i>${AI.live ? t('set.aiLive') : t('set.aiOff')}</p>
        <h4>${t('set.data')}</h4><p class="muted">${t('set.dataS')}</p><button class="btn danger" data-act="reset">${icon('refresh')} ${t('set.reset')}</button></div></div>`;
  }
  function assignModal() {
    const list = D.enquiries.filter(e => !e.counsellor && e.status !== 'lost').slice(0, 8);
    modal(t('qa.assign'), list.length ? `<ul class="assign">${list.map(e => `<li>${avatar(e.name, 'sm')}<div><b>${esc(nm(e.name))}</b><small>${t('f.' + e.field)} · ${t('c.' + e.country)}</small></div><select data-act="assign" data-id="${e.id}" aria-label="${t('enq.assign')}"><option value="">${t('enq.unassigned')}</option>${COUNSELLORS.map(c => `<option value="${c.id}">${esc(nm(c.name))}</option>`).join('')}</select></li>`).join('')}</ul>` : `<p class="empty">${t('fu.empty')}</p>`);
  }

  /* ================= ROUTER ================= */
  const PAGES = { dashboard: pgDashboard, enquiries: pgEnquiries, students: pgStudents, applications: pgApplications, counsellors: pgCounsellors, universities: pgUniversities, courses: pgCourses, followups: pgFollowups, tasks: pgTasks, whatsapp: pgWhatsapp, reports: pgReports, settings: pgSettings };
  function route() { const m = (location.hash || '#/').match(/^#\/app\/?([a-z]*)/); return m ? { app: true, page: m[1] || 'dashboard' } : { app: false }; }
  function render() {
    const r = route(), root = $('#root'); document.title = 'EduBridge — Study Abroad CRM + AI Adviser | Live demo';
    if (r.app && USER) {
      const pg = PAGES[r.page] ? r.page : 'dashboard'; root.innerHTML = shell(pg, PAGES[pg]()); document.body.className = 'in-app';
      if (pg === 'applications') initDrag(); const ms = $('#msgs'); if (ms) ms.scrollTop = ms.scrollHeight;
      if (render._pg !== pg) window.scrollTo(0, 0); render._pg = pg;
    } else { root.innerHTML = landing(); document.body.className = 'in-land'; if (r.app && !USER) setTimeout(startModal, 50); render._pg = null; }
    renderChat();
  }
  window.addEventListener('hashchange', () => { UI.sidebar = false; UI.menus = null; closeDrawer(); render(); });
  function startModal() {
    modal(t('start.t'), `<p class="muted">${t('start.s')}</p><form class="form" data-form="start" novalidate><label>${t('start.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('start.email')} *<input name="email" type="email" required maxlength="120" autocomplete="email"></label>
      <div class="row2"><label>${t('start.company')}<input name="company" maxlength="80"></label><label>${t('start.wa')}<input name="whatsapp" type="tel" maxlength="25"></label></div><p class="err" hidden>${t('start.req')}</p>
      <button class="btn org block lg" type="submit">${t('start.go')} ${icon('arrowRight', 'flip')}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('start.privacy')}</p></form>`, 'narrow');
  }

  /* ================= EVENTS ================= */
  function globalSearch(q) {
    const box = $('#sres'); if (!box) return; q = q.trim().toLowerCase(); if (q.length < 2) { box.classList.remove('open'); return; }
    const es = D.enquiries.filter(e => e.name.en.toLowerCase().includes(q) || (e.name.ar || '').includes(q) || e.phone.replace(/\s/g, '').includes(q)).slice(0, 6);
    const us = UNIS.filter(u => (u.name + ' ' + u.ar + ' ' + u.city).toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = (es.map(e => `<button data-act="enq" data-id="${e.id}">${avatar(e.name, 'sm')}<span>${esc(nm(e.name))}</span><small>${t('f.' + e.field)}</small></button>`).join('') + us.map(u => `<button data-act="goUni">${icon('uni')}<span>${esc(uniName(u))}</span><small>${t('c.' + u.c)}</small></button>`).join('')) || `<p class="empty">${t('enq.empty')}</p>`;
    box.classList.add('open');
  }
  document.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-act]');
    if (!a || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'checkbox')) { if (UI.menus && !ev.target.closest('.dd')) { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); } if (!ev.target.closest('#gsearch')) { const b = $('#sres'); if (b) b.classList.remove('open'); } return; }
    const act = a.dataset.act, id = a.dataset.id;
    if (!['menu', 'lang'].includes(act) && UI.menus) { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); }
    switch (act) {
      case 'menu': ev.preventDefault(); UI.menus = UI.menus === id ? null : id; $$('.dd').forEach(d => d.classList.toggle('open', d.contains(a) && !!UI.menus)); break;
      case 'lang': PREFS.lang = a.dataset.l; savePrefs(); I18N.set(a.dataset.l); UI.menus = null; render(); break;
      case 'theme': PREFS.theme = PREFS.theme === 'dark' ? 'light' : 'dark'; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'setTheme': PREFS.theme = a.dataset.v; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'start': ev.preventDefault(); $('.lnav') && $('.lnav').classList.remove('open'); if (USER) location.hash = '#/app/dashboard'; else startModal(); break;
      case 'scroll': { ev.preventDefault(); $('.lnav').classList.remove('open'); const el = $(a.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth' }); break; }
      case 'scrollCons': { const el = $('#consult'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => { const i = $('#consult input'); if (i) i.focus({ preventScroll: true }); }, 500); } break; }
      case 'lnav': $('.lnav').classList.toggle('open'); break;
      case 'svcScroll': { const row = $('#svcRow'); const dir = document.documentElement.dir === 'rtl' ? -1 : 1; row.scrollBy({ left: +a.dataset.d * dir * (row.clientWidth * 0.8), behavior: 'smooth' }); break; }
      case 'closeModal': closeModal(); break;
      case 'closeDrawer': closeDrawer(); break;
      case 'nav': UI.sidebar = false; break;
      case 'sidebar': UI.sidebar = !UI.sidebar; $('.app') && $('.app').classList.toggle('sb-open', UI.sidebar); break;
      case 'logout': USER = null; try { localStorage.removeItem(UKEY); localStorage.removeItem(KEY); } catch (e) {} D = SEED.seed(); save(); location.hash = '#/'; render(); break;
      case 'reset': if (confirm(t('set.reset') + '?')) { D = SEED.seed(); save(); UI.chat = null; toast(t('set.resetDone')); render(); } break;
      case 'markRead': D.notifs.forEach(n => n.read = true); save(); render(); break;
      // AI adviser
      case 'openAI': openChat(); break;
      case 'closeAI': CHAT.open = false; renderChat(); break;
      case 'aiReset': Object.assign(CHAT, { items: [], ctx: {}, mode: null, hist: [], unis: [] }); renderChat(); break;
      case 'aiCountry': CHAT.open = true; chatInit(); stepCountry(a.dataset.c); renderChat(); break;
      case 'aiLevel': stepLevel(a.dataset.l); renderChat(); break;
      case 'aiField': CHAT.open = true; chatInit(); if (!CHAT.ctx.level) CHAT.ctx.level = 'ug'; stepField(a.dataset.f); renderChat(); break;
      case 'aiElig': CHAT.mode = 'elig'; userSay(t('ai.btnElig')); botSay(t('ai.eligAsk')); renderChat(); break;
      case 'aiFee': { userSay(t('ai.btnFee')); const list = CHAT.unis.length ? CHAT.unis.map(uni) : currentUnis(); botSay(t('ai.fees') + '\n' + list.map(u => `• ${uniName(u)}: ~${sar(u.fee)}${t('ab.yr')}`).join('\n') + '\n' + t('ai.living')); renderChat(); break; }
      case 'aiTalk': CHAT.mode = 'contact'; userSay(t('ai.btnTalk')); botSay(t('ai.counsellor')); renderChat(); break;
      case 'uniAsk': { const u = uni(id); CHAT.open = true; chatInit(); CHAT.ctx.country = u.c; CHAT.unis = [u.id]; handleText((L() === 'en' ? 'Tell me about ' : L() === 'ar' ? 'أخبرني عن ' : 'مجھے بتائیں ') + uniName(u)); break; }
      // CRM
      case 'enq': { const b = $('#sres'); if (b) b.classList.remove('open'); closeModal(); if (id) enqDrawer(id); break; }
      case 'goUni': location.hash = '#/app/universities'; break;
      case 'addEnq': modal(t('enq.new'), enqForm()); break;
      case 'editEnq': closeDrawer(); modal(t('enq.edit'), enqForm(enq(id))); break;
      case 'delEnq': if (confirm(t('enq.confirmDel'))) { D.enquiries = D.enquiries.filter(e => e.id !== id); D.applications = D.applications.filter(x => x.enqId !== id); save(); closeDrawer(); toast(t('enq.deleted')); render(); } break;
      case 'ef': UI.ef[a.dataset.k] = a.dataset.v; UI.page = 1; render(); break;
      case 'more': UI.page++; render(); break;
      case 'export': exportCSV(); break;
      case 'addApp': modal(t('app.add'), appForm()); break;
      case 'toApp': closeDrawer(); modal(t('app.add'), appForm(id)); break;
      case 'goWa': location.hash = '#/app/whatsapp'; break;
      case 'assignModal': assignModal(); break;
      case 'elig': {
        const e = enq(id); a.disabled = true; a.innerHTML = `<span class="spin"></span> ${t('enq.thinking')}`;
        const list = e.uniId ? [uni(e.uniId)] : UNIS.filter(u => u.c === e.country && u.fields.includes(e.field)).slice(0, 3);
        e.ai = await AI.eligibility(e, list.length ? list : UNIS.filter(u => u.c === e.country).slice(0, 3), L()); save(); enqDrawer(id); break;
      }
      case 'follow': {
        const e = enq(id), box = $('#aiFollow'); a.disabled = true; box.innerHTML = `<p class="muted"><span class="spin"></span> ${t('enq.thinking')}</p>`;
        const r = await AI.followup(e, uni(e.uniId), L(), userName()); a.disabled = false;
        box.innerHTML = `<div class="draft">${r.live ? `<span class="livebadge">${t('ai.live')}</span>` : ''}<textarea rows="6" id="draftTxt" aria-label="draft">${esc(r.text)}</textarea><div class="row-btns"><button class="btn ghost sm" data-act="copyDraft">${icon('copy')} ${t('enq.copy')}</button><button class="btn wa sm" data-act="waDraft">${icon('whatsapp')} ${t('enq.openWa')}</button></div></div>`; break;
      }
      case 'copyDraft': { const v = $('#draftTxt').value; try { await navigator.clipboard.writeText(v); } catch (e) { $('#draftTxt').select(); document.execCommand && document.execCommand('copy'); } toast(t('enq.copied')); break; }
      case 'waDraft': window.open('https://wa.me/?text=' + encodeURIComponent($('#draftTxt').value), '_blank', 'noopener'); break;
      case 'fuDone': { const f = D.followups.find(x => x.id === id); f.done = true; save(); toast(t('fu.doneT')); render(); break; }
      case 'toggleTask': { const tk = D.tasks.find(x => x.id === id); tk.done = !tk.done; save(); if (tk.done) toast(t('tasks.completed')); setTimeout(render, tk.done ? 250 : 0); break; }
      case 'delTask': D.tasks = D.tasks.filter(x => x.id !== id); save(); render(); break;
      case 'tf': UI.tf = a.dataset.v; render(); break;
      case 'openChat': { UI.chat = id; const c = D.chats.find(x => x.id === id); c.unread = 0; save(); render(); break; }
      case 'closeChat': UI.chat = null; render(); break;
      case 'aiSuggest': {
        const c = D.chats.find(x => x.id === UI.chat), e = enq(c.enqId) || D.enquiries[0], inp = $('.mcomp input'); inp.value = '…'; a.disabled = true;
        const r = await AI.suggestReply(c.msgs.slice(-6).map(m => ({ role: m.me ? 'agent' : 'student', text: msgText(m) })), e, uni(e.uniId), L(), userName());
        inp.value = r.text; a.disabled = false; inp.focus(); break;
      }
    }
  });
  document.addEventListener('change', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    if (act === 'srcRange') { UI.src = a.value; render(); }
    else if (act === 'esel') { UI.ef[a.dataset.k] = a.value; UI.page = 1; render(); }
    else if (act === 'moveApp') moveApp(a.dataset.id, a.value);
    else if (act === 'assign') { const e = enq(a.dataset.id); e.counsellor = a.value || null; if (e.counsellor && e.status === 'new') e.status = 'contacted'; save(); toast(t('enq.assigned')); if (!$('#modal.open')) { render(); if ($('#drawer.open')) enqDrawer(e.id); } }
  });
  let qT;
  document.addEventListener('input', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'eq') { clearTimeout(qT); qT = setTimeout(() => { UI.ef.q = a.value; UI.page = 1; const pos = a.selectionStart; render(); const n = $('[data-act="eq"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 220); }
    if (a.dataset.act === 'gsearch') globalSearch(a.value);
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if ($('#modal.open')) closeModal(); else if ($('#drawer.open')) closeDrawer(); else if (CHAT.open) { CHAT.open = false; renderChat(); } } });
  document.addEventListener('error', ev => { const im = ev.target; if (im.tagName === 'IMG' && !im.dataset.fb && /unsplash/.test(im.src)) { im.dataset.fb = 1; im.style.visibility = 'hidden'; } }, true);

  document.addEventListener('submit', ev => {
    const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries()), kind = f.dataset.form;
    const bad = $$('[required]', f).filter(i => !String(i.value).trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)));
    $$('.invalid', f).forEach(i => i.classList.remove('invalid')); bad.forEach(i => i.classList.add('invalid'));
    if (bad.length) { const er = $('.err', f); if (er) er.hidden = false; else toast(t('common.required'), 'err'); bad[0].focus(); return; }
    switch (kind) {
      case 'start': USER = { name: fd.name.trim(), email: fd.email.trim(), company: (fd.company || '').trim(), whatsapp: (fd.whatsapp || '').trim() }; lsSet(UKEY, USER);
        sendForm({ _subject: 'New EduBridge demo visitor: ' + USER.name, name: USER.name, email: USER.email, company: USER.company, whatsapp: USER.whatsapp, language: L(), demo: 'EduBridge Study Abroad CRM' }); closeModal(); location.hash = '#/app/dashboard'; render(); break;
      case 'consult': { const phone = fd.cc + ' ' + fd.phone.trim(); addEnquiry({ name: { en: fd.name.trim(), ar: fd.name.trim() }, phone, source: 'website', field: fd.field, country: 'uk', notes: 'Website consultation form' });
        sendForm({ _subject: 'EduBridge demo — consultation request from ' + fd.name, name: fd.name, whatsapp: phone, course: fd.field, language: L() }); f.reset(); toast(t('cons.ok')); break; }
      case 'contact': sendForm({ _subject: 'EduBridge demo — contact from ' + fd.name, name: fd.name, email: fd.email, message: fd.message, language: L() }); f.reset(); toast(t('contact.sent')); break;
      case 'enq': { const idv = f.dataset.id; const data = { name: { en: fd.name.trim(), ar: fd.name.trim() }, phone: fd.phone.trim(), country: fd.country, level: fd.level, field: fd.field, grade: fd.grade === '' ? null : +fd.grade, ielts: fd.ielts === '' ? null : +fd.ielts, budget: +fd.budget || 0, source: fd.source, status: fd.status, notes: fd.notes };
        if (idv) { const e = enq(idv); if (e.name.en === data.name.en) data.name = e.name; Object.assign(e, data); delete e.ai; } else addEnquiry(data);
        save(); closeModal(); toast(t('enq.saved')); render(); break; }
      case 'app': { const e = enq(fd.enqId); D.applications.unshift({ id: uid('a'), enqId: e.id, name: e.name, uniId: fd.uniId, field: e.field, level: e.level, stage: 'docs', intake: fd.intake, updated: Date.now() }); if (e.status === 'new' || e.status === 'contacted') e.status = 'followup'; e.uniId = fd.uniId; save(); closeModal(); toast(t('enq.appMade')); location.hash = '#/app/applications'; render(); break; }
      case 'task': { const d0 = new Date(); d0.setHours(0, 0, 0, 0); D.tasks.push({ id: uid('t'), text: fd.text.trim(), due: d0.getTime() + (+fd.when) * 864e5 + 17 * 3600000, done: false }); save(); toast(t('tasks.saved')); render(); break; }
      case 'msg': { const txt = (fd.text || '').trim(); if (!txt) return; D.chats.find(x => x.id === UI.chat).msgs.push({ me: 1, at: Date.now(), text: txt }); save(); render(); const i = $('.mcomp input'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); break; }
      case 'ai': { const q = f.q.value; f.q.value = ''; handleText(q); break; }
      case 'profile': USER.name = fd.name.trim(); USER.company = (fd.company || '').trim(); lsSet(UKEY, USER); toast(t('set.saved')); render(); break;
    }
  });
  function exportCSV() {
    const rows = [['Name', 'WhatsApp', 'Country', 'Level', 'Course', 'Source', 'Status', 'Counsellor', 'Grade %', 'IELTS', 'Budget SAR', 'Created']];
    D.enquiries.forEach(e => rows.push([e.name.en, e.phone, e.country, e.level, e.field, e.source, e.status, e.counsellor ? csl(e.counsellor).name.en : '', e.grade ?? '', e.ielts ?? '', e.budget || '', new Date(e.created).toISOString().slice(0, 10)]));
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'edubridge-enquiries-sample.csv'; document.body.appendChild(a); a.click(); a.remove(); toast(t('rep.exported'));
  }
  render(); AI.health().then(() => { if (route().page === 'settings') render(); });
  window.__EB = { get D() { return D; }, CHAT, render };
})();
