/* ProfitPilot V3: extends the V2 chronological inventory and debt ledger. */
(function(root){
'use strict';
const TYPES=['income','expense','purchase','waste','capital','draw','openingCash','borrow','lend','openingDebt','payment','refund','transfer'];
const BOOKS=['personal','business'];
const PROFILES=['retail','food','service','general'];
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function assert(ok,message){if(!ok)throw new Error(message);}
function str(s,max=160){return typeof s==='string'&&s.length<=max;}
function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s&&s>='1900-01-01'&&s<='2200-12-31';}
function amount(n,zero=true){return Number.isFinite(n)&&n>=(zero?0:1)&&n<=1e12&&Number.isInteger(n);}
function quantity(n,zero=false){return Number.isInteger(n)&&n>=(zero?0:1)&&n<=1e6;}
function initial(){return {schema:3,profile:'general',entries:[],items:[],budgets:[],goals:[]};}
function validate(s){
 assert(s&&[2,3].includes(s.schema)&&PROFILES.includes(s.profile)&&Array.isArray(s.entries)&&Array.isArray(s.items),'Format cadangan tidak cocok dengan ProfitPilot.');
 assert(s.entries.length<=20000&&s.items.length<=2000,'Cadangan terlalu besar (maksimal 20.000 catatan dan 2.000 item).');
 assert(s.schema===2||Array.isArray(s.budgets)&&Array.isArray(s.goals),'Anggaran atau target tidak valid.');
 const budgets=s.budgets||[],goals=s.goals||[];
 assert(Array.isArray(budgets)&&budgets.length<=1200&&Array.isArray(goals)&&goals.length<=100,'Terlalu banyak anggaran atau target.');
 const keys=new Set();
 for(const b of budgets){assert(b&&date(b.month+'-01')&&str(b.category,80)&&b.category.trim()&&amount(b.amount,false),'Anggaran tidak valid.');const key=b.month+'|'+b.category;assert(!keys.has(key),'Anggaran kategori bulan ini sudah ada.');keys.add(key);}
 for(const g of goals)assert(g&&str(g.id,80)&&g.id&&str(g.name,80)&&g.name.trim()&&amount(g.target,false)&&amount(g.saved)&&g.saved<=g.target,'Target tabungan tidak valid.');
 assert(new Set(goals.map(g=>g.id)).size===goals.length,'ID target ganda.');
 const ids=new Set();
 for(const p of s.items){assert(p&&str(p.id,80)&&p.id&&!ids.has(p.id),'ID item tidak valid atau ganda.');ids.add(p.id);assert(str(p.name,80)&&p.name.trim()&&str(p.unit,24)&&p.unit.trim()&&date(p.date)&&quantity(p.openingQty,true)&&amount(p.openingCost)&&quantity(p.minimum,true),'Data item tidak valid.');assert(p.openingQty*p.openingCost<=1e12,'Nilai stok awal terlalu besar.');}
 for(const e of s.entries){assert(e&&str(e.id,80)&&e.id&&!ids.has(e.id),'ID catatan tidak valid atau ganda.');ids.add(e.id);assert(!Object.hasOwn(e,'opening'),'Properti cadangan tidak diizinkan.');assert(amount(e.discount??0)&&amount(e.packaging??0),'Diskon atau kemasan tidak valid.');assert(e.type==='income'&&e.book==='business'||!(e.discount||e.packaging),'Diskon dan kemasan hanya untuk penjualan.');assert(BOOKS.includes(e.book)&&TYPES.includes(e.type)&&date(e.date)&&str(e.note)&&str(e.category,80)&&str(e.ref,80)&&str(e.itemId,80)&&str(e.due,10)&&str(e.alias,80)&&['cash','credit'].includes(e.payment)&&['payable','receivable'].includes(e.direction)&&typeof e.deleted==='boolean','Data catatan tidak valid.');assert(amount(e.amount)&&amount(e.directCost)&&amount(e.fee)&&amount(e.price)&&quantity(e.qty),'Nominal atau jumlah tidak valid.');assert(!e.due||date(e.due)&&e.due>=e.date,'Jatuh tempo tidak boleh mendahului tanggal catatan.');assert(e.book==='business'||!['purchase','waste','capital','draw'].includes(e.type),'Jenis catatan tidak cocok untuk keuangan pribadi.');assert(e.book==='business'||!e.itemId,'Stok hanya tersedia dalam catatan bisnis.');assert(!['purchase','waste'].includes(e.type)||!!e.itemId,'Pilih item stok.');assert(!e.itemId||['income','purchase','waste'].includes(e.type),'Item stok tidak sesuai jenis catatan.');assert(e.type==='income'&&e.book==='business'||!e.directCost&&!e.fee,'Biaya langsung hanya untuk penjualan bisnis.');assert(!e.itemId||!e.directCost,'HPP item stok dihitung otomatis, jangan isi lagi.');assert(['income','expense','purchase'].includes(e.type)||e.payment==='cash','Pembayaran tempo tidak sesuai jenis catatan.');assert(e.type!=='payment'||!!e.ref,'Pilih utang atau piutang.');assert(e.type!=='openingDebt'||!e.itemId,'Saldo utang tidak boleh mengubah stok.');if(!['income','waste'].includes(e.type))assert(e.amount>0,'Nominal harus lebih dari 0.');}
 return s;
}
function ledger(s){
 validate(s);
 const inventory=new Map(s.items.map(p=>[p.id,{...p,qty:0,value:0,active:false}]));
 const debts=new Map();const rows=[];
 const events=[...s.items.map((p,i)=>({date:p.date,order:-s.items.length+i,opening:p})),...s.entries.map((e,i)=>({...e,order:i})).filter(e=>!e.deleted)].sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
 for(const e of events){
  if(e.opening){const p=inventory.get(e.opening.id);p.qty=p.openingQty;p.value=p.openingQty*p.openingCost;p.active=true;continue;}
  const row={...e,cash:0,income:0,cogs:0,expense:0,paymentAmount:0};
  const p=e.itemId?inventory.get(e.itemId):null;
  if(e.itemId)assert(p&&p.active,'Item stok belum tersedia pada '+e.date+'. Periksa tanggal stok awal.');
  let total=e.amount;
  if(e.type==='income'){
   if(e.book==='business'){total=e.qty*e.price-(e.discount||0);assert(total>=0,'Diskon melebihi penjualan.');assert(e.qty*e.price<=1e12,'Nilai penjualan terlalu besar.');}
   row.amount=total;row.income=total;
   if(p){assert(p.qty>=e.qty,'Stok '+p.name+' tidak cukup pada '+e.date+'.');row.cogs=round(p.value/p.qty*e.qty);p.qty-=e.qty;p.value=round(p.value-row.cogs);if(!p.qty)p.value=0;}
   else row.cogs=e.directCost;
   row.expense=e.fee+(e.packaging||0);row.cash=(e.payment==='cash'?total:0)-e.fee-e.directCost-(e.packaging||0);
  }else if(e.type==='expense'){row.expense=total;row.cash=e.payment==='cash'?-total:0;}
  else if(e.type==='purchase'){assert(p,'Pilih item stok.');p.qty+=e.qty;assert(p.qty<=1e9,'Jumlah stok terlalu besar.');p.value+=total;row.cash=e.payment==='cash'?-total:0;}
  else if(e.type==='waste'){assert(p&&p.qty>=e.qty,'Stok tidak cukup untuk pemakaian atau pengurangan ini.');row.expense=round(p.value/p.qty*e.qty);p.qty-=e.qty;p.value=round(p.value-row.expense);if(!p.qty)p.value=0;row.amount=row.expense;}
  else if(['capital','borrow','openingCash'].includes(e.type))row.cash=total;
  else if(['draw','lend'].includes(e.type))row.cash=-total;
  else if(e.type==='refund'){
   const sale=rows.find(r=>r.id===e.ref&&r.book===e.book&&r.type==='income');
   assert(e.book==='business'&&sale&&sale.payment==='cash','Retur hanya untuk penjualan bisnis yang sejak awal lunas.');
   assert(!rows.some(r=>r.type==='refund'&&r.ref===e.ref),'Penjualan ini sudah diretur penuh.');
   row.amount=sale.amount;row.income=-sale.income;row.cash=-sale.amount;
   if(sale.itemId){const stock=inventory.get(sale.itemId);stock.qty+=sale.qty;stock.value=round(stock.value+sale.cogs);row.cogs=-sale.cogs;}
  }
  else if(e.type==='payment'){
   const debt=debts.get(e.ref);assert(debt&&debt.book===e.book,'Catatan asal utang/piutang tidak ditemukan atau tanggalnya lebih baru.');assert(total<=debt.remaining+.001,'Pembayaran melebihi sisa utang/piutang.');debt.remaining=round(debt.remaining-total);debt.paid=round(debt.paid+total);debt.payments.push(e.id);row.cash=debt.direction==='payable'?-total:total;row.paymentAmount=total;
  }
  const credit=['income','expense','purchase'].includes(e.type)&&e.payment==='credit';
  if(credit||['borrow','lend','openingDebt'].includes(e.type)){
   assert(total>0,'Utang atau piutang harus lebih dari 0.');const direction=credit?(e.type==='income'?'receivable':'payable'):e.type==='openingDebt'?e.direction:e.type==='borrow'?'payable':'receivable';
   debts.set(e.id,{id:e.id,book:e.book,date:e.date,due:e.due,alias:e.alias,note:e.note,direction,total,remaining:total,paid:0,payments:[]});
  }
  row.cash=round(row.cash);rows.push(row);
 }
 const exposure=rows.reduce((n,r)=>n+Math.abs(r.cash)+Math.abs(r.income)+Math.abs(r.cogs)+Math.abs(r.expense),0)+[...inventory.values()].reduce((n,p)=>n+p.value,0);
 assert(exposure<=1e13,'Total catatan terlalu besar untuk ketelitian aplikasi ini. Pisahkan arsip periode lama.');
 return {inventory:[...inventory.values()],debts:[...debts.values()],rows};
}
function report(s,book,month=''){
 const full=ledger(s);const rows=full.rows.filter(e=>e.book===book&&(!month||e.date.startsWith(month)));
 const sum=k=>round(rows.reduce((n,e)=>n+e[k],0));
 const income=sum('income'),cogs=sum('cogs'),expense=sum('expense');
 const openingCash=month?round(full.rows.filter(e=>e.book===book&&e.date<month+'-01').reduce((n,e)=>n+e.cash,0)):0;
 const asOf=month?month+'-31':'2200-12-31';
 const historic=ledger({...s,items:s.items.filter(p=>p.date<=asOf),entries:s.entries.filter(e=>e.date<=asOf)});
 const debtSum=direction=>round(historic.debts.filter(d=>d.book===book&&d.direction===direction).reduce((n,d)=>n+d.remaining,0));
 return {rows,income,cogs,expense,profit:round(income-cogs-expense),cash:sum('cash'),openingCash,closingCash:round(openingCash+sum('cash')),payable:debtSum('payable'),receivable:debtSum('receivable'),inventory:book==='business'?round(historic.inventory.reduce((n,p)=>n+p.value,0)):0};
}
function apply(s,change){const next=JSON.parse(JSON.stringify(s));change(next);ledger(next);return next;}
function parseRupiah(s){s=String(s).trim();if(!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(s))return NaN;return Number(s.replace(/\./g,''));}
function importData(raw){const s=JSON.parse(raw);validate(s);ledger(s);return {schema:3,profile:s.profile,budgets:(s.budgets||[]).map(b=>({month:b.month,category:b.category,amount:b.amount})),goals:(s.goals||[]).map(g=>({id:g.id,name:g.name,target:g.target,saved:g.saved})),items:s.items.map(p=>({id:p.id,name:p.name,unit:p.unit,date:p.date,openingQty:p.openingQty,openingCost:p.openingCost,minimum:p.minimum})),entries:s.entries.map(e=>Object.fromEntries(['discount','packaging','id','book','type','date','note','category','ref','itemId','due','alias','payment','direction','deleted','amount','directCost','fee','price','qty'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]])))};}
const api={initial,validate,ledger,report,apply,parseRupiah,importData,round,date};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PP=api;
})(typeof globalThis!=='undefined'?globalThis:this);
