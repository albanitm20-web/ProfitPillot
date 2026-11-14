/* Recovery uses its own origin-bound PKCE record, separate from Google and books. */
(function(root){
 const KEY='profitpilot.recovery.pkce.v1';
 const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 async function prepare(origin,storage,cryptoAPI=crypto){
  const target=new URL(origin);
  if(target.protocol!=='https:'&&!(target.protocol==='http:'&&['localhost','127.0.0.1'].includes(target.hostname)))throw Error('Buka aplikasi lewat HTTPS untuk memulihkan password.');
  const verifier=b64(cryptoAPI.getRandomValues(new Uint8Array(32)));
  const challenge=b64(new Uint8Array(await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  storage.setItem(KEY,JSON.stringify({verifier,origin:target.origin,created:Date.now()}));
  return {redirect:target.origin+'/?recovery=password',challenge};
 }
 function consume(origin,storage,now=Date.now()){
  let v;try{v=JSON.parse(storage.getItem(KEY));}catch{}finally{storage.removeItem(KEY);}
  if(!v||v.origin!==origin||!Number.isFinite(v.created)||now<v.created||now-v.created>600000||! /^[A-Za-z0-9_-]{43}$/.test(v.verifier))throw Error('Tautan pemulihan tidak cocok dengan sesi ini atau sudah kedaluwarsa. Minta tautan baru dan buka di tab browser ini.');
  return v.verifier;
 }
 const api={KEY,prepare,consume};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PPRecovery=api;
})(globalThis);
