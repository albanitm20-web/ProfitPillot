const {chromium}=require('playwright'),{default:AxeBuilder}=require('@axe-core/playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('./fixture.cjs')(),base=process.env.PP_TEST_URL||'http://127.0.0.1:4189',out=process.env.PP_QA_OUTPUT||path.resolve('test-results');
const evidence={checks:[],audits:[]};let browser,page;
(async()=>{
 browser=await chromium.launch({channel:process.env.PP_BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(data=>{if(!localStorage.getItem('dual-seed')){localStorage.setItem('profitpilot.v3',JSON.stringify(data));localStorage.setItem('profitpilot.appearance.v1',JSON.stringify({palette:'rose',mode:'dark'}));localStorage.setItem('dual-seed','1');}},data);
 page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 assert.equal(await page.locator('html').getAttribute('data-dashboard'),'classic');
 assert.equal(await page.locator('html').getAttribute('data-palette'),'rose');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 const ledger=await page.evaluate(()=>JSON.stringify(state)),reports=await page.evaluate(()=>['personal','business'].map(b=>JSON.stringify(PP.report(state,b,month()))));
 const open=()=>page.locator('#dashboard-switch').click();
 const choose=async style=>{await open();await page.locator('[data-dashboard-choice="'+style+'"]').click();await page.locator('[data-close="settings-dialog"]').first().click();};
 const unchanged=async()=>{assert.equal(await page.evaluate(()=>JSON.stringify(state)),ledger);assert.deepEqual(await page.evaluate(()=>['personal','business'].map(b=>JSON.stringify(PP.report(state,b,month())))),reports);};
 for(const book of ['personal','business']){
  await page.locator('[data-mode="'+book+'"]').click();
  for(const style of ['classic','modern','classic']){await choose(style);await unchanged();assert.equal(await page.locator('#v5-dashboard').isVisible(),style==='modern');assert.equal(await page.locator('.tabs').evaluate(e=>getComputedStyle(e).position),style==='modern'?'fixed':'static');}
  for(const style of ['classic','modern'])for(const width of [360,390,430,768,1440]){
   await page.setViewportSize({width,height:width<768?844:1000});await choose(style);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if([390,1440].includes(width))await page.screenshot({animations:'disabled',path:path.join(out,'dual-'+book+'-'+style+'-'+width+'.png'),fullPage:true});
   await unchanged();
  }
 }
 evidence.checks.push('Both books, bidirectional switches, five widths: same full state and reports');
 await page.setViewportSize({width:1440,height:900});
 for(const style of ['classic','modern'])for(const palette of ['emerald','ocean','purple','rose','sunset'])for(const mode of ['light','dark']){
  await choose(style);await open();await page.locator('[data-palette-choice="'+palette+'"]').click();await page.locator('[data-mode-choice="'+mode+'"]').click();await page.locator('[data-close="settings-dialog"]').first().click();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();evidence.audits.push({style,palette,mode,violations:audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});assert.equal(audit.violations.length,0,JSON.stringify(evidence.audits.at(-1)));await unchanged();
 }
 await open();await page.locator('[data-mode-choice="system"]').click();await page.locator('[data-close="settings-dialog"]').first().click();
 for(const style of ['classic','modern']){await choose(style);for(const colorScheme of ['dark','light']){await page.emulateMedia({colorScheme});await page.waitForFunction(c=>document.documentElement.dataset.theme===c,colorScheme);}}
 await page.locator('.tabs [data-tab="transactions"]').click();await page.locator('#search').fill('Fiktif');const before=await page.locator('#search').inputValue();await choose('classic');await choose('modern');assert.equal(await page.locator('#search').inputValue(),before);assert.ok(await page.locator('#transactions-panel').isVisible());
 await page.reload();assert.equal(await page.locator('html').getAttribute('data-dashboard'),'modern');await unchanged();
 const tab2=await context.newPage();await tab2.goto(base);await choose('classic');await tab2.waitForFunction(()=>document.documentElement.dataset.dashboard==='classic');await tab2.close();
 const other=await browser.newContext();const otherPage=await other.newPage();await otherPage.goto(base);assert.equal(await otherPage.locator('html').getAttribute('data-dashboard'),'classic');assert.equal(await otherPage.locator('#v5-dashboard').isVisible(),false);await other.close();
 evidence.checks.push('Ten themes per style, System, filter preserved during switches, refresh, same-browser tabs, independent browser defaults');
 assert.equal(errors.length,0,errors.join('\n'));await browser.close();evidence.status='passed';fs.writeFileSync(path.join(out,'dual-results.json'),JSON.stringify(evidence,null,2));console.log('PASS Dual Dashboard: 4 book/style combinations, 5 viewports, 20 accessibility audits, immutable ledger and preferences.');
})().catch(async error=>{evidence.error=error.stack;if(page)await page.screenshot({animations:'disabled',path:path.join(out,'dual-failure.png')}).catch(()=>{});if(browser)await browser.close();fs.writeFileSync(path.join(out,'dual-results.json'),JSON.stringify(evidence,null,2));console.error(error);process.exit(1);});
