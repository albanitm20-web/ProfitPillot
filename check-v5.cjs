const assert=require('node:assert/strict'),PP=require('./core.js'),model=require('./v5-model.js'),theme=require('./appearance.js');
const state=PP.initial();let seq=0;
function entry(type,date,amount,category,book='personal',extra={}){state.entries.push({id:'test-'+(++seq),book,type,date,note:'Fiktif '+seq,category,ref:'',itemId:'',due:'',alias:'',payment:'cash',direction:'payable',deleted:false,amount,directCost:0,fee:0,price:0,qty:1,...extra});}
entry('openingCash','2026-10-01',1000000,'');entry('income','2026-11-01',5000000,'Gaji');entry('expense','2026-11-08',600000,'Makan');entry('expense','2026-10-08',100000,'Makan');entry('income','2026-11-02',1000000,'Penjualan','business',{qty:2,price:500000,directCost:200000,fee:10000,packaging:10000,payment:'credit'});
state.budgets=[{month:'2026-11',category:'Makan',amount:500000}];state.goals=[{id:'g',name:'Dana cadangan',target:10000000,saved:2000000}];
const before=JSON.stringify(state),m=model.overview(state,'personal','2026-11',PP);
assert.equal(m.report.closingCash,5300000);assert.equal(m.report.profit,4400000);assert.equal(m.budgets[0].spent-m.budgets[0].amount,100000);assert.equal(m.categoryTotal,600000);assert.equal(m.series.reduce((s,d)=>s+d.incoming,0),5000000);assert.equal(m.series.reduce((s,d)=>s+d.outgoing,0),600000);assert.equal(m.goals[0].saved,2000000);
const b=model.overview(state,'business','2026-11',PP);assert.equal(b.report.receivable,1000000);assert.equal(b.report.closingCash,-220000);assert.equal(b.report.profit,780000);assert.equal(JSON.stringify(state),before);
for(let i=0;i<8;i++)entry('expense','2026-11-10',10000,'Category '+i);
assert.equal(model.overview(state,'personal','2026-11',PP).categories.length,6);assert.equal(model.overview(state,'personal','2026-02',PP).series.length,4);assert.equal(model.overview(state,'personal','2024-02',PP).series.length,5);
assert.equal(theme.normalize({compact:'true',reducedMotion:1,layout:'anything'}).compact,false);assert.equal(theme.normalize({compact:true,reducedMotion:true,layout:'productivity'}).layout,'productivity');
console.log('PASS V5: period-aware charts, spending aggregation, over-budget amount, saved targets, separate books, cash vs profit, February/leap-year buckets, immutable selectors and validated appearance options.');
