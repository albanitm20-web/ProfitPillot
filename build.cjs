const fs=require('node:fs');const path=require('node:path');
const root=__dirname;const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let calculator=read('v1.html');
calculator=calculator.replace('Laris itu bagus.<br><em>Tahu labanya</em> lebih bagus.','Cek laba sebelum<br><em>menentukan harga.</em>').replace('Cek uang yang tersisa dari setiap produk terjual.<br>Atur biaya, lihat margin, temukan harga yang pas.','Masukkan harga dan biaya per produk. Lihat sisa laba dan harga untuk margin yang kamu inginkan.').replace('Harga untuk laba yang kamu incar','Harga untuk target margin').replace('Kenali angka. Putuskan lebih yakin.','Kalkulator laba per produk.');
const calcStyle=calculator.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/:root/g,':host').replace(/body\{/g,'.calc-page{');
const calcScript=calculator.match(/<script>([\s\S]*?)<\/script>/)[1];
const calcBody=calculator.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script>[\s\S]*?<\/script>/,'');
const calcMarkup='<style>:host{display:block}.calc-page{overflow:visible}button{min-height:44px;min-width:44px}.toast{pointer-events:none}'+calcStyle+'</style><div class="calc-page">'+calcBody+'</div>';
const calcInit='(function(){const host=document.getElementById("calculator-host");const scope=host.attachShadow({mode:"open"});scope.innerHTML='+JSON.stringify(calcMarkup).replace(/</g,'\\u003c')+';(function(document){'+calcScript+'})(scope);document.documentElement.setAttribute("data-app-ready","true");document.getElementById("startup-status").hidden=true;})();';
const url=(process.env.SUPABASE_URL||'').trim().replace(/\/$/,''),key=(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(!!url!==!!key)throw new Error('Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
if(url&&!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('Use the HTTPS Supabase project URL.');
if(key&&!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)){let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role;}catch{}if(role!=='anon')throw new Error('Only a public publishable or anon key is allowed. Never use a secret/service_role key.');}
const cloud=read('cloud.js').replace('/*PUBLIC_CONFIG*/{}',JSON.stringify({url,key}).replace(/</g,'\\u003c'));
const html=read('app.html').replace('/*CLOUD_ORIGIN*/',url).replace('/*APP_STYLE*/',()=>read('app.css')+'\n'+read('v4.css')).replace('/*CORE_JS*/',()=>read('core.js')).replace('/*CLOUD_JS*/',()=>cloud).replace('/*APP_JS*/',()=>read('app.js')).replace('/*V3_JS*/',()=>read('v3.js')).replace('/*CALCULATOR_JS*/',()=>calcInit).replace('/*V4_JS*/',()=>read('v4.js'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
for(const name of ['manifest.webmanifest','sw.js','icon-192.png','icon-512.png'])fs.copyFileSync(path.join(root,'public',name),path.join(root,'dist',name));
console.log('Built ProfitPilot V4: '+Buffer.byteLength(html)+' bytes. Cloud '+(url?'configured':'not configured (local mode)'));

