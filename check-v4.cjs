const assert=require('node:assert/strict');const {weeklyCash}=require('./v4');
const rows=[{book:'personal',date:'2026-09-29',cash:1000},{book:'personal',date:'2026-09-30',cash:500},{book:'personal',date:'2026-10-02',cash:-200},{book:'personal',date:'2026-10-06',cash:9000},{book:'business',date:'2026-10-02',cash:10000},{book:'personal',date:'2026-10-03',cash:0}];
const before=JSON.stringify(rows),result=weeklyCash(rows,'personal','2026-10-05');assert.deepEqual(result,{start:'2026-09-29',end:'2026-10-05',count:4,incoming:1500,outgoing:200});assert.equal(JSON.stringify(rows),before);
assert.deepEqual(weeklyCash([],'business','2026-01-03'),{start:'2025-12-28',end:'2026-01-03',count:0,incoming:0,outgoing:0});
assert.equal(weeklyCash(rows,'business','2026-10-05').incoming,10000);
assert.equal(weeklyCash([{book:'business',date:'2026-10-05',cash:-15000}],'business','2026-10-05').outgoing,15000);
// WCAG AA for normal labels and white primary-button text.
const luminance=hex=>{const c=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
for(const [fg,bg] of [['126b57','ffffff'],['536b65','f7faf8'],['132b2a','d9f3e8'],['c6e5d9','132b2a']]){const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);}
console.log('PASS V4 seven-day range, year/month boundary, book separation, net cash, empty state, immutability and text contrast.');
