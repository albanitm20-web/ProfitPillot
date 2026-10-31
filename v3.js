function askConfirm(message){return new Promise(resolve=>{const dialog=$('confirm-dialog');$('confirm-message').textContent=message;const finish=value=>{dialog.close();$('confirm-yes').onclick=null;$('confirm-no').onclick=null;dialog.oncancel=null;resolve(value);};$('confirm-yes').onclick=()=>finish(true);$('confirm-no').onclick=()=>finish(false);dialog.oncancel=e=>{e.preventDefault();finish(false);};dialog.showModal();});}
// Email confirmation may redirect with a token fragment. This app asks the user
// to sign in explicitly; remove the fragment rather than retaining credentials in the URL.
if(/(?:access_token|refresh_token|error_description)=/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);
document.querySelector('.brand').addEventListener('click',()=>setTab('summary'));
async function openRefund(id){const sale=state.entries.find(e=>e.id===id);if(!sale)return;if(!await askConfirm('Retur penuh hari ini? Seluruh uang penjualan dikembalikan dan barang masuk stok dengan HPP asal. Fee, kemasan, serta biaya jasa tetap menjadi biaya. Retur sebagian atau tempo belum didukung.'))return;try{mutate(s=>s.entries.push({...makeEntry(),book:'business',type:'refund',date:today(),ref:id,amount:Math.max(1,sale.qty*sale.price-(sale.discount||0)),note:('Retur: '+sale.note).slice(0,160),category:sale.category}));toast('Retur dicatat pada hari ini.');}catch(e){toast(e.message);}}
function renderPlans(){
 $('plans-tab').hidden=mode!=='personal';if(mode!=='personal'&&tab==='plans')setTab('summary');
 const r=PP.report(state,'personal',month()),categories=new Map();for(const e of r.rows){if(e.expense>0)categories.set(e.category||'Lainnya',(categories.get(e.category||'Lainnya')||0)+e.expense);}
 $('personal-categories').innerHTML=[...new Set(['Makan & belanja','Transportasi','Tagihan','Hiburan',...categories.keys()])].map(c=>`<option value="${esc(c)}"></option>`).join('');
 const budgets=(state.budgets||[]).filter(b=>b.month===month());
 $('budget-list').innerHTML=month()?(budgets.length?budgets.map(b=>{const spent=categories.get(b.category)||0;return `<div class="plan-row"><strong>${esc(b.category)}</strong><p>${money(spent)} dari ${money(b.amount)}${spent>b.amount?' · Melewati anggaran':''}</p><progress aria-label="Anggaran ${esc(b.category)}" max="${b.amount}" value="${Math.min(spent,b.amount)}"></progress><button class="quiet" data-budget-edit="${esc(b.category)}">Ubah</button><button class="quiet danger" data-budget-delete="${esc(b.category)}">Hapus</button></div>`;}).join(''):'<p class="hint">Belum ada anggaran bulan ini. Isi kategori dan batas pengeluaran.</p>'):'<p class="hint">Pilih satu bulan laporan untuk mengatur anggaran.</p>';
 const total=[...categories.values()].reduce((n,v)=>n+v,0);
 $('category-chart').innerHTML=categories.size?[...categories.entries()].sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="plan-row"><p>${esc(c)} · ${money(v)} (${fmt.format(v/total*100)}%)</p><div class="chart-bar" style="width:${v/total*100}%"></div></div>`).join(''):'<p class="hint">Belum ada pengeluaran pada periode ini.</p>';
 $('goal-list').innerHTML=(state.goals||[]).map(g=>`<div class="plan-row"><strong>${esc(g.name)}</strong><p>${money(g.saved)} dari ${money(g.target)}</p><progress aria-label="Target ${esc(g.name)}" max="${g.target}" value="${g.saved}"></progress><button class="quiet" data-goal-edit="${esc(g.id)}">Ubah</button><button class="quiet danger" data-goal-delete="${esc(g.id)}">Hapus</button></div>`).join('')||'<p class="hint">Tambahkan tujuan yang ingin kamu capai.</p>';
}
$('budget-form').addEventListener('submit',e=>{e.preventDefault();try{if(!month())throw new Error('Pilih bulan laporan terlebih dahulu.');const category=$('budget-category').value.trim(),amount=numeric('budget-amount',{zero:false});mutate(s=>{s.budgets=s.budgets||[];const old=s.budgets.find(b=>b.month===month()&&b.category===category);if(old)old.amount=amount;else s.budgets.push({month:month(),category,amount});});$('plan-error').textContent='';toast('Anggaran tersimpan.');}catch(e){err('plan-error',e);}});
$('goal-form').addEventListener('submit',e=>{e.preventDefault();try{const g={id:$('goal-id').value||uid(),name:$('goal-name').value.trim(),target:numeric('goal-target',{zero:false}),saved:numeric('goal-saved')};mutate(s=>{s.goals=s.goals||[];const i=s.goals.findIndex(x=>x.id===g.id);if(i<0)s.goals.push(g);else s.goals[i]=g;});$('goal-form').reset();$('plan-error').textContent='';toast('Target tersimpan.');}catch(e){err('plan-error',e);}});
document.addEventListener('click',async e=>{const d=e.target.closest('button')?.dataset;if(!d)return;try{
 if(d.budgetEdit){const b=state.budgets.find(b=>b.month===month()&&b.category===d.budgetEdit);$('budget-category').value=b.category;$('budget-amount').value=b.amount;}
 if(d.budgetDelete&&await askConfirm('Hapus anggaran kategori ini? Transaksi tetap ada.'))mutate(s=>s.budgets=s.budgets.filter(b=>b.month!==month()||b.category!==d.budgetDelete));
 if(d.goalEdit){const g=state.goals.find(g=>g.id===d.goalEdit);for(const k of ['id','name','target','saved'])$('goal-'+k).value=g[k];}
 if(d.goalDelete&&await askConfirm('Hapus target tabungan ini? Saldo tidak berubah.'))mutate(s=>s.goals=s.goals.filter(g=>g.id!==d.goalDelete));
 }catch(e){err('plan-error',e);}});
for(const id of ['filter-from','filter-to','filter-category'])$(id).addEventListener('change',()=>renderTransactions(PP.report(state,mode,month())));
$('reset-filters').addEventListener('click',()=>{for(const id of ['filter-from','filter-to','filter-category','search'])$(id).value='';$('filter-kind').value='all';render();});
const oldMode=setMode;setMode=value=>{for(const id of ['filter-from','filter-to','filter-category'])$(id).value='';oldMode(value);};

// Cloud mode is opt-in. Local V2/V3 data is never silently uploaded or merged.
const cloud=PPCloud.client(PPCloud.config);
const SESSION='profitpilot.auth.v3',META='profitpilot.cloud.meta.v3';
let cloudUser=null,cloudRevision=0,syncedRaw=null,syncTimer=null,syncing=false,cloudConflict=false,cloudLoading=false;
beforeSave=()=>{if(cloudLoading)throw new Error('Tunggu proses akun selesai sebelum mengubah catatan.');};
function cloudMessage(message){$('cloud-status').hidden=false;$('cloud-status').textContent=message;}
function rememberSession(){sessionStorage.setItem(SESSION,JSON.stringify(cloud.session));}
function rememberMeta(){sessionStorage.setItem(META,JSON.stringify({user:cloudUser.id,revision:cloudRevision,syncedRaw}));}
function clearBookUI(){pendingImport=null;previousImport=null;editingEntry=null;editingItem=null;payingId=null;$('import-file').value='';$('confirm-import').hidden=true;$('undo-import').hidden=true;$('import-preview').textContent='';$('goal-form').reset();$('budget-form').reset();$('goal-id').value='';$('plan-error').textContent='';}
function accountUI(){
 $('auth-form').hidden=!cloud.enabled||!!cloudUser;$('account-actions').hidden=!cloudUser;
 $('account-info').textContent=!cloud.enabled?'Login belum tersedia: pemilik aplikasi perlu menghubungkan Supabase. Kamu tetap bisa mencatat di perangkat ini.':cloudUser?'Masuk sebagai '+cloudUser.email:'Masuk untuk menyimpan catatan ke akun. Setelah daftar, konfirmasi email lalu masuk.';
 $('storage-label').textContent=cloudUser?'Catatan akun':'Disimpan di perangkat ini';
}
afterSave=()=>{if(!cloudUser)return;rememberMeta();cloudMessage('Perubahan tersimpan di sesi perangkat ini. Menunggu sinkronisasi…');clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncCloud(),700);};
async function syncCloud(){if(!cloudUser||syncing||cloudLoading)return;if(cloudConflict){cloudMessage('Ada perubahan di perangkat lain. Unduh cadangan lalu pilih Ambil data server.');return;}syncing=true;const raw=JSON.stringify(state);try{
 if(raw!==syncedRaw){cloudRevision=await cloud.write(PP.importData(raw),cloudRevision);syncedRaw=raw;rememberMeta();}rememberSession();cloudMessage('Tersimpan di akun · '+new Date().toLocaleTimeString('id-ID'));if(JSON.stringify(state)!==syncedRaw)syncTimer=setTimeout(()=>syncCloud(),300);
 }catch(e){if(e.status===409)cloudConflict=true;cloudMessage('Belum tersimpan di server. '+e.message+' Unduh cadangan jika perlu menutup halaman.');}finally{syncing=false;}}
function loadLocal(){KEY='profitpilot.v3';state=PP.initial();lastStored=null;corrupt=false;volatile=false;clearBookUI();try{storage=localStorage;lastStored=storage.getItem(KEY);if(lastStored)state=PP.importData(lastStored);}catch{corrupt=!!lastStored;volatile=!lastStored;showStorage('Penyimpanan lokal tidak bisa dibaca. Unduh cadangan sebelum melanjutkan.');}render();}
async function enterAccount(){cloudLoading=true;document.querySelector('main').inert=true;try{
 const user=cloud.session.user;const row=await cloud.read();const remote=row?PP.importData(JSON.stringify(row.data)):PP.initial();
 const key='profitpilot.account.'+user.id;const cache=sessionStorage.getItem(key);let meta=null;try{meta=JSON.parse(sessionStorage.getItem(META));}catch{}
 const restored=PPCloud.reconcile(remote,cache,meta,user.id,row?.revision||0,PP.importData);
 // Verify writable session storage before switching books.
 sessionStorage.setItem(key,JSON.stringify(restored.state));
 cloudUser=user;cloudRevision=row?.revision||0;syncedRaw=restored.syncedRaw;cloudConflict=restored.conflict;
 KEY=key;storage=sessionStorage;state=restored.state;corrupt=false;volatile=false;clearBookUI();
 lastStored=JSON.stringify(state);storage.setItem(KEY,lastStored);rememberSession();rememberMeta();$('storage-warning').hidden=true;render();accountUI();
 cloudMessage(cloudConflict?'Catatan sesi belum terkirim dan server telah berubah. Unduh cadangan, lalu ambil data server.':'Catatan akun dibuka. Catatan lokal tetap terpisah.');
 }finally{cloudLoading=false;document.querySelector('main').inert=false;}}
$('account-open').addEventListener('click',()=>{accountUI();$('account-error').textContent='';$('account-dialog').showModal();});
$('auth-form').addEventListener('submit',async e=>{e.preventDefault();if(cloudLoading)return;const buttons=[...$('auth-form').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('account-error').textContent='';try{
 const email=$('auth-email').value.trim(),password=$('auth-password').value;if(password.length<8)throw new Error('Gunakan password minimal 8 karakter.');
 if(e.submitter?.value==='signup'){await cloud.signup(email,password);$('account-error').textContent='Permintaan pendaftaran diterima. Periksa email konfirmasi, lalu masuk. Jika email sudah terdaftar, gunakan akun yang ada.';}else{await cloud.login(email,password);await enterAccount();$('account-dialog').close();}
 $('auth-password').value='';
 }catch(e){err('account-error',e);}finally{buttons.forEach(b=>b.disabled=false);}});
$('sync-now').addEventListener('click',()=>syncCloud());
$('pull-cloud').addEventListener('click',async()=>{if(syncing||cloudLoading){toast('Tunggu sinkronisasi selesai.');return;}if(!await askConfirm('Ambil catatan server dan ganti catatan sesi ini? Unduh cadangan dulu jika ada perubahan yang belum terkirim.'))return;if(syncing){toast('Tunggu sinkronisasi selesai.');return;}clearTimeout(syncTimer);cloudLoading=true;document.querySelector('main').inert=true;try{const row=await cloud.read();const next=row?PP.importData(JSON.stringify(row.data)):PP.initial();cloudRevision=row?.revision||0;state=next;syncedRaw=JSON.stringify(next);lastStored=syncedRaw;storage.setItem(KEY,lastStored);cloudConflict=false;rememberMeta();rememberSession();render();cloudMessage('Catatan server sudah dimuat.');}catch(e){err('account-error',e);}finally{cloudLoading=false;document.querySelector('main').inert=false;}});
$('migrate-local').addEventListener('click',async()=>{try{if(state.entries.length||state.items.length||(state.budgets||[]).length||(state.goals||[]).length)throw new Error('Migrasi hanya untuk akun kosong agar catatan akun tidak tertimpa.');const raw=localStorage.getItem('profitpilot.v3')||localStorage.getItem('profitpilot.v2');if(!raw)throw new Error('Tidak ada catatan lokal di browser ini. Gunakan impor cadangan dari perangkat lama.');const next=PP.importData(raw);if(!await askConfirm('Salin '+next.entries.length+' catatan lokal ke akun ini? Catatan lokal asli tetap disimpan.'))return;save(next);toast('Catatan disalin. Periksa status sinkronisasi.');}catch(e){err('account-error',e);}});
$('logout').addEventListener('click',async()=>{if(syncing||cloudLoading){toast('Tunggu proses akun selesai.');return;}if(JSON.stringify(state)!==syncedRaw&&!await askConfirm('Ada perubahan yang belum tersimpan di server. Unduh cadangan terlebih dahulu. Tetap keluar dan hapus cache sesi ini?'))return;if(syncing){toast('Tunggu sinkronisasi selesai.');return;}clearTimeout(syncTimer);cloudLoading=true;document.querySelector('main').inert=true;try{await cloud.logout();}catch{toast('Keluar dari perangkat ini. Sesi server akan berakhir sesuai masa token.');}finally{sessionStorage.removeItem(KEY);sessionStorage.removeItem(SESSION);sessionStorage.removeItem(META);cloudUser=null;cloudConflict=false;cloudLoading=false;document.querySelector('main').inert=false;loadLocal();accountUI();$('cloud-status').hidden=true;$('account-dialog').close();}});
window.addEventListener('beforeunload',e=>{if(cloudUser&&JSON.stringify(state)!==syncedRaw){e.preventDefault();e.returnValue='';}});
window.addEventListener('online',()=>syncCloud());

let installPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install-app').hidden=false;});
$('install-app').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('install-app').hidden=true;});
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();setTab('summary');accountUI();
(async()=>{if(!cloud.enabled)return;cloudLoading=true;let saved;const params=new URLSearchParams(location.search);const callback=params.get('oauth')==='google';try{
 if(callback){
  const code=params.get('code'),failed=params.has('error')||params.has('error_description');
  history.replaceState(null,'',location.pathname+location.hash);
  document.querySelector('main').inert=true;cloudMessage('Memeriksa akun Google…');
  const verifier=PPOAuth.consume(sessionStorage,location.origin);
  if(failed||!code)throw Error('Masuk dengan Google dibatalkan atau tidak berhasil. Coba lagi.');
  await cloud.exchangeGoogle(code,verifier);await enterAccount();cloudMessage('Berhasil masuk. Catatan akun sudah dibuka.');
 }else{saved=sessionStorage.getItem(SESSION);if(saved){document.querySelector('main').inert=true;cloudMessage('Memeriksa sesi akun…');await cloud.restore(JSON.parse(saved));await enterAccount();if(!cloudConflict)await syncCloud();}}
 }catch(e){cloudUser=null;loadLocal();accountUI();cloudMessage(callback?e.message:'Sesi akun belum bisa dibuka. Masuk kembali untuk memulihkan cache sesi. Catatan lokal ditampilkan.');if(callback){$('account-error').textContent=e.message;$('account-dialog').showModal();}}finally{cloudLoading=false;document.querySelector('main').inert=false;}})();
$('google-login').addEventListener('click',async()=>{
 const buttons=[...$('auth-form').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('account-error').textContent='';
 try{if(cloudUser||cloudLoading)throw Error('Tunggu proses akun selesai.');if(!await cloud.googleAvailable())throw Error('Login Google belum diaktifkan. Kamu tetap bisa masuk dengan email dan password.');
 const url=await PPOAuth.prepare(PPCloud.config,location.origin,sessionStorage);location.assign(url);
 }catch(e){err('account-error',e);buttons.forEach(b=>b.disabled=false);}
});
