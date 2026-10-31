/* Supabase PKCE: verifier stays in this tab, callback codes are single-use. */
(function(root){
 const KEY='profitpilot.oauth.pkce.v1';
 const base64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 async function prepare(config,origin,storage,cryptoAPI=crypto){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url))throw Error('Layanan akun belum dikonfigurasi.');
  const target=new URL(origin);if(target.protocol!=='https:'&&!(target.protocol==='http:'&&['localhost','127.0.0.1'].includes(target.hostname)))throw Error('Buka aplikasi melalui HTTPS untuk masuk dengan Google.');
  const verifier=base64(cryptoAPI.getRandomValues(new Uint8Array(32)));
  const challenge=base64(new Uint8Array(await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  const redirect=target.origin+'/?oauth=google';
  storage.setItem(KEY,JSON.stringify({verifier,created:Date.now(),origin:target.origin}));
  const url=new URL(config.url+'/auth/v1/authorize');url.search=new URLSearchParams({provider:'google',redirect_to:redirect,code_challenge:challenge,code_challenge_method:'s256',scopes:'email profile'});return url.href;
 }
 function consume(storage,origin,now=Date.now()){
  const raw=storage.getItem(KEY);storage.removeItem(KEY);let value;try{value=JSON.parse(raw);}catch{}
  if(!value||value.origin!==origin||!Number.isFinite(value.created)||now-value.created>600000||now<value.created||! /^[A-Za-z0-9_-]{43}$/.test(value.verifier))throw Error('Sesi masuk Google sudah berakhir. Coba lagi dari tombol Google di perangkat ini.');
  return value.verifier;
 }
 const api={prepare,consume,KEY};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PPOAuth=api;
})(globalThis);
