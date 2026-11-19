// Smoke tests: node tests/smoke.js [baseUrl]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4174/';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://formsubmit.co/**', r => r.fulfill({ status: 200, body: '{"success":"true"}', contentType: 'application/json' }));
  await p.route('https://images.unsplash.com/**', r => r.abort());
  await p.goto(BASE); await p.evaluate(() => localStorage.clear()); await p.reload();
  for (const l of ['en', 'ar', 'ur']) { await p.evaluate(l => localStorage.setItem('edubridge_prefs', JSON.stringify({ lang: l })), l); await p.reload(); ok(await p.locator('html').getAttribute('dir') === (l === 'en' ? 'ltr' : 'rtl') && await p.locator('.hero h1').isVisible(), 'landing renders in ' + l); }
  await p.evaluate(() => localStorage.setItem('edubridge_prefs', JSON.stringify({ lang: 'en' }))); await p.reload();
  // consultation form → CRM + email
  let sent = p.waitForRequest(r => r.url().includes('formsubmit.co'));
  await p.click('#consult button[type=submit]'); ok(await p.locator('#consult input.invalid').count() > 0, 'consultation form validates');
  await p.fill('#consult [name=name]', 'Consult Test'); await p.fill('#consult [name=phone]', '500000777'); await p.selectOption('#consult [name=field]', 'nursing'); await p.click('#consult button[type=submit]');
  ok((await sent).postDataJSON().course === 'nursing' && await p.evaluate(() => window.__EB.D.enquiries[0].name.en === 'Consult Test'), 'consultation → email + CRM enquiry');
  // AI adviser guided flow (fallback)
  await p.click('.aifab'); await p.click('.wchips button[data-c=ca]'); await p.click('.wchips button[data-l=pg]'); await p.click('.wfield[data-f=business]');
  ok(await p.locator('.wuni').count() > 0, 'adviser shows universities');
  await p.click('.wacts button[data-act=aiFee]'); ok((await p.textContent('#wbody')).includes('SAR'), 'fee details');
  await p.click('.wacts button[data-act=aiElig]'); await p.fill('.wcomp input', '82%, IELTS 6.5, budget 120000'); await p.press('.wcomp input', 'Enter');
  await p.waitForSelector('.welig', { timeout: 30000 }); ok(true, 'eligibility result');
  const n0 = await p.evaluate(() => window.__EB.D.enquiries.length);
  await p.fill('.wcomp input', 'My name is Omar Test 0500000123'); await p.press('.wcomp input', 'Enter');
  await p.waitForFunction(n => window.__EB.D.enquiries.length > n, n0, { timeout: 30000 });
  ok(await p.evaluate(() => { const e = window.__EB.D.enquiries[0]; return e.source === 'aichat' && e.country === 'ca' && e.field === 'business' && e.grade === 82; }), 'adviser creates CRM enquiry with context');
  await p.fill('.wcomp input', 'Do you help with scholarships?'); await p.press('.wcomp input', 'Enter');
  await p.waitForFunction(() => !document.querySelector('.typing') && /scholar/i.test(document.querySelector('#wbody').textContent.slice(-400)), null, { timeout: 30000 }); ok(true, 'free-text answer');
  await p.click('[data-act=closeAI]');
  // start demo
  sent = p.waitForRequest(r => r.url().includes('formsubmit.co'));
  await p.click('.lacts [data-act=start]'); await p.click('[data-form=start] button[type=submit]'); ok(await p.locator('[data-form=start] .err').isVisible(), 'start form validates');
  await p.fill('[data-form=start] [name=name]', 'Test Visitor'); await p.fill('[data-form=start] [name=email]', 'test@example.com'); await p.click('[data-form=start] button[type=submit]');
  ok((await sent).postDataJSON().email === 'test@example.com', 'demo visitor emailed'); await p.waitForSelector('.kpis'); ok((await p.textContent('.ubtn')).includes('Test Visitor'), 'name in CRM');
  ok((await p.textContent('.tbl')).includes('Omar Test'), 'AI enquiry visible on dashboard');
  // enquiries CRUD
  await p.goto(BASE + '#/app/enquiries'); await p.click('.phead [data-act=addEnq]'); await p.fill('[data-form=enq] [name=name]', 'Khalid Test'); await p.fill('[data-form=enq] [name=phone]', '+966 50 000 9999'); await p.click('[data-form=enq] button[type=submit]');
  ok((await p.textContent('.tbl tbody tr:first-child')).includes('Khalid Test'), 'add enquiry');
  await p.fill('[data-act=eq]', 'Khalid Test'); await p.waitForTimeout(400); ok(await p.locator('.tbl tbody tr').count() === 1, 'search');
  await p.click('.tbl tbody tr:first-child td:first-child'); await p.selectOption('#drawer select[data-act=assign]', 'k2');
  ok(await p.evaluate(() => window.__EB.D.enquiries[0].counsellor === 'k2'), 'assign counsellor');
  await p.click('#aiEl [data-act=elig]'); await p.waitForSelector('#aiEl .welig', { timeout: 30000 }); ok(true, 'AI eligibility in drawer');
  await p.click('[data-act=follow]'); await p.waitForSelector('#draftTxt', { timeout: 30000 }); ok((await p.inputValue('#draftTxt')).includes('Khalid'), 'follow-up draft');
  await p.click('[data-act=toApp]'); await p.click('[data-form=app] button[type=submit]'); await p.waitForSelector('#kanban');
  ok((await p.textContent('.kcol[data-stage=docs]')).includes('Khalid Test'), 'application created');
  const card = p.locator('.kcol[data-stage=docs] .kcard').filter({ hasText: 'Khalid Test' }); const id = await card.getAttribute('data-app');
  const cb = await card.boundingBox(); const tb = await p.locator('.kcol[data-stage=offer]').boundingBox();
  await p.mouse.move(cb.x + 40, cb.y + 30); await p.mouse.down(); await p.mouse.move(cb.x + 80, cb.y + 60, { steps: 4 }); await p.mouse.move(tb.x + 60, tb.y + 80, { steps: 12 }); await p.mouse.up();
  ok(await p.evaluate(id => window.__EB.D.applications.find(a => a.id === id).stage, id) === 'offer', 'drag application');
  // follow-ups, tasks, whatsapp
  await p.goto(BASE + '#/app/followups'); const f0 = await p.locator('[data-act=fuDone]').count(); await p.click('[data-act=fuDone] >> nth=0'); ok(await p.locator('[data-act=fuDone]').count() === f0 - 1, 'follow-up done');
  await p.goto(BASE + '#/app/tasks'); await p.fill('[data-form=task] [name=text]', 'Send offer letter'); await p.click('[data-form=task] button'); ok((await p.textContent('.tasks')).includes('Send offer letter'), 'add task');
  await p.goto(BASE + '#/app/whatsapp'); await p.click('.ichat >> nth=0'); await p.fill('.mcomp input', 'See you tomorrow'); await p.press('.mcomp input', 'Enter'); ok((await p.textContent('#msgs')).includes('See you tomorrow'), 'send WhatsApp msg');
  await p.click('[data-act=aiSuggest]'); await p.waitForFunction(() => document.querySelector('.mcomp input').value.length > 10, null, { timeout: 30000 }); ok(true, 'AI suggest reply');
  await p.goto(BASE + '#/app/dashboard'); await p.click('[data-act=assignModal]'); ok(await p.locator('.assign li').count() > 0, 'assign modal'); await p.keyboard.press('Escape');
  await p.goto(BASE + '#/app/reports'); const dl = p.waitForEvent('download'); await p.click('.phead [data-act=export]'); ok(!!(await dl), 'CSV export');
  await p.click('[data-act=theme]'); ok(await p.locator('html').getAttribute('data-theme') === 'dark', 'theme toggle'); await p.click('[data-act=theme]');
  await p.click('[data-act=menu][data-id=user]'); await p.click('.ddm [data-act=logout]'); ok(await p.locator('.hero').isVisible(), 'logout');
  for (const w of [360, 390, 768]) for (const l of ['en', 'ar', 'ur']) {
    const m = await b.newContext({ viewport: { width: w, height: 800 } }); const q = await m.newPage(); await q.route('https://images.unsplash.com/**', r => r.abort());
    await q.goto(BASE); await q.evaluate(l => { localStorage.setItem('edubridge_prefs', JSON.stringify({ lang: l })); localStorage.setItem('edubridge_user', JSON.stringify({ name: 'A Very Long Visitor Name', email: 'a@b.co' })); }, l);
    const bad = [];
    for (const h of ['', '#/app/dashboard', '#/app/enquiries', '#/app/students', '#/app/applications', '#/app/counsellors', '#/app/universities', '#/app/courses', '#/app/followups', '#/app/tasks', '#/app/whatsapp', '#/app/reports', '#/app/settings']) {
      await q.goto(BASE + h); await q.reload(); await q.waitForTimeout(120); const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push(h + ':' + o);
    }
    await q.goto(BASE); await q.reload(); await q.click('.aifab'); await q.click('.wchips button[data-c=uk]'); await q.click('.wchips button[data-l=ug]'); await q.click('.wfield[data-f=cs]');
    const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push('chat:' + o);
    ok(!bad.length, `no overflow ${w}px ${l} ${bad.join(' ')}`); await m.close();
  }
  ok(!errs.length, 'no JS errors ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
