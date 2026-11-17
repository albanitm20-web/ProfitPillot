const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PP_TEST_URL||'http://127.0.0.1:4189',out=path.resolve('test-results');
(async()=>{for(const [name,engine] of [['chrome',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,...(name==='chrome'?{channel:'chrome'}:{})});
 try{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(data=>localStorage.setItem('profitpilot.v3',JSON.stringify(data)),require('./fixture.cjs')());const page=await context.newPage();await page.goto(base);
 async function contained(selector,parent){const box=await page.locator(selector).boundingBox(),outer=await page.locator(parent).boundingBox();assert.ok(box&&outer);assert.ok(box.x>=outer.x-1&&box.x+box.width<=outer.x+outer.width+1,selector+' exceeds '+parent);}
 for(const width of [320,360,390,430])for(const style of ['classic','modern']){
  await page.setViewportSize({width,height:844});await page.locator('#dashboard-switch').click();await page.locator('[data-dashboard-choice="'+style+'"]').click();await page.locator('[data-close="settings-dialog"]').first().click();
  await contained('#period','#period-bar');await contained('#all-period','#period-bar');const month=await page.locator('#period').boundingBox(),all=await page.locator('#all-period').boundingBox();assert.ok(month.x+month.width<=all.x,'Month overlaps Semua waktu');
  await page.locator('[data-mobile="transactions"]').click();for(const id of ['filter-from','filter-to','filter-category','filter-kind'])await contained('#'+id,'#transactions-panel');
  const from=await page.locator('#filter-from').boundingBox(),to=await page.locator('#filter-to').boundingBox(),category=await page.locator('#filter-category').boundingBox();assert.ok(from.y+from.height<to.y&&to.y+to.height<category.y);
  if(width===390)await page.screenshot({path:path.join(out,name+'-'+style+'-mobile-filters.png'),fullPage:true,animations:'disabled'});
  await page.locator('[data-mobile="add"]').click();await contained('#category-picker','#entry-dialog');assert.ok(await page.locator('.category-picker-arrow').isVisible());await page.locator('#category-picker').selectOption('Gaji');assert.equal(await page.locator('#entry-category').inputValue(),'Gaji');await page.locator('#entry-category').fill('Kategori sendiri');assert.equal(await page.locator('#entry-category').inputValue(),'Kategori sendiri');
  if(width===390)await page.screenshot({path:path.join(out,name+'-'+style+'-category-picker.png'),animations:'disabled'});
  await page.locator('[data-close="entry-dialog"]').first().click();await page.locator('#confirm-yes').click();
 }
 console.log('PASS '+name+': Classic/Modern, four phone widths, bounded date/month filters, visible category picker and custom category.');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
