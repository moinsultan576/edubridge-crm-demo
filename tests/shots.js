const { chromium } = require('playwright');
const B = process.env.BASE || 'http://localhost:4174/';
(async () => {
  const b = await chromium.launch(); const errs = [];
  const shot = async (name, w, h, lang, hash, setup) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    await p.route('https://images.unsplash.com/**', r => r.abort());
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/formsubmit|Failed to load resource|ERR_FAILED/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await p.goto(B); await p.evaluate(([l]) => { localStorage.setItem('edubridge_prefs', JSON.stringify({ lang: l })); localStorage.setItem('edubridge_user', JSON.stringify({ name: 'Demo Visitor', email: 'demo@example.com' })); }, [lang]);
    await p.goto(B + hash); await p.reload(); await p.waitForTimeout(500);
    if (setup) await setup(p);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) errs.push(`${name} overflow ${ov}px`);
    await p.screenshot({ path: `/tmp/eb/${name}.png`, fullPage: !!process.env.FULL }); await ctx.close();
  };
  for (const pg of (process.argv[2] || 'land').split(',')) for (const l of (process.argv[3] || 'en').split(',')) {
    const hash = pg === 'land' ? '' : pg === 'chat' ? '' : '#/app/' + pg;
    const setup = pg === 'chat' ? async p => { await p.click('.aifab'); await p.click('.wchips button[data-c=ca]'); await p.click('.wchips button[data-l=pg]'); await p.click('.wfield[data-f=business]'); await p.waitForTimeout(300); } : null;
    await shot(`${pg}-${l}-d`, 1440, 900, l, hash, setup); if (process.argv[4]) await shot(`${pg}-${l}-m`, 390, 844, l, hash, setup);
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
