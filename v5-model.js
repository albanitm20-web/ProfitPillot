/* Read-only presentation selectors. All monetary totals come from core.js. */
(function(root){
 function overview(state,book,period,core){
  const r=core.report(state,book,period),all=core.ledger(state);
  const grouped=new Map();
  for(const row of r.rows)if(row.expense>0)grouped.set(row.category||'Lainnya',(grouped.get(row.category||'Lainnya')||0)+row.expense);
  const categories=[...grouped].sort((a,b)=>b[1]-a[1]);
  const top=categories.length>5?[...categories.slice(0,5),['Kategori lainnya',categories.slice(5).reduce((s,v)=>s+v[1],0)]]:categories;
  const budgets=book==='personal'&&period?(state.budgets||[]).filter(b=>b.month===period).map(b=>({...b,spent:grouped.get(b.category)||0})):[];
  const dates=[...new Set(r.rows.map(r=>r.date))].sort();
  const buckets=period?Array.from({length:5},(_,i)=>({label:(i*7+1)+'–'+Math.min(i*7+7,new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate()),start:period+'-'+String(i*7+1).padStart(2,'0'),end:period+'-'+String(Math.min(i*7+7,31)).padStart(2,'0')})).filter(b=>Number(b.start.slice(-2))<=new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate()):[...new Set(dates.map(d=>d.slice(0,7)))].slice(-12).map(m=>({label:m,start:m+'-01',end:m+'-31'}));
  const series=buckets.map(b=>({...b,incoming:r.rows.filter(r=>r.date>=b.start&&r.date<=b.end).reduce((s,r)=>s+Math.max(0,r.cash),0),outgoing:r.rows.filter(r=>r.date>=b.start&&r.date<=b.end).reduce((s,r)=>s+Math.max(0,-r.cash),0)}));
  return {report:r,categories:top,categoryTotal:categories.reduce((s,c)=>s+c[1],0),budgets,goals:state.goals||[],series,lowStock:all.inventory.filter(p=>p.qty<=p.minimum),openDebts:all.debts.filter(d=>d.book===book&&d.remaining>0)};
 }
 const api={overview};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PPV5=api;
})(globalThis);
