/* Supabase Auth + PostgREST. Public configuration is inserted at build time. */
(function(root){
'use strict';
const config=/*PUBLIC_CONFIG*/{};
function client(config,fetcher=fetch){
 let session=null;
 const enabled=!!config.url&&!!config.key;
 async function request(path,{method='GET',body,auth=false,headers={}}={}){
  if(!enabled)throw new Error('Layanan akun belum dikonfigurasi. Catatan lokal tetap bisa digunakan.');
  const res=await fetcher(config.url+path,{method,headers:{apikey:config.key,'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+session.access_token}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
  const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('Respons server tidak dapat dibaca.');}
  if(!res.ok){const error=new Error(res.status===401||res.status===400&&path.includes('/token')?'Email/password salah, email belum dikonfirmasi, atau sesi berakhir.':res.status===409?'Catatan server sudah berubah. Ambil data server setelah mengunduh cadangan.':res.status===429?'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.':'Permintaan gagal ('+res.status+'). Periksa koneksi dan konfigurasi Supabase.');error.status=res.status;throw error;}
  return data;
 }
 function keep(value){session=value?{access_token:value.access_token,refresh_token:value.refresh_token,expires_at:value.expires_at||Math.floor(Date.now()/1000)+(value.expires_in||3600),user:value.user}:null;return session;}
 async function valid(){if(!session)throw new Error('Masuk terlebih dahulu.');if(session.expires_at<Date.now()/1000+60){keep(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}));}return session;}
 return {enabled,get session(){return session;},
  async login(email,password){return keep(await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}));},
  async signup(email,password){return request('/auth/v1/signup',{method:'POST',body:{email,password}});},
  async restore(value){keep(value);await valid();const user=await request('/auth/v1/user',{auth:true});session.user=user;return session;},
  async logout(){try{if(session){await valid();await request('/auth/v1/logout',{method:'POST',auth:true});}}finally{keep(null);}},
  async read(){await valid();const rows=await request('/rest/v1/profitpilot_books?select=data,revision&user_id=eq.'+encodeURIComponent(session.user.id),{auth:true});return rows[0]||null;},
  async write(data,revision){await valid();return request('/rest/v1/rpc/save_profitpilot',{method:'POST',auth:true,body:{payload:data,expected_revision:revision}});}
 };
}
function reconcile(remote,cache,meta,user,revision,parse){
 const remoteRaw=JSON.stringify(remote);
 if(!cache||meta?.user!==user||cache===meta.syncedRaw)return {state:remote,syncedRaw:remoteRaw,conflict:false};
 const state=parse(cache),conflict=meta.revision!==revision;
 return {state,syncedRaw:conflict?remoteRaw:meta.syncedRaw,conflict};
}
const api={client,config,reconcile};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PPCloud=api;
})(typeof globalThis!=='undefined'?globalThis:this);
