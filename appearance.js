/* Applied before paint; no financial data is read or changed. */
(function(root){
 const palettes=['emerald','ocean','purple','rose','sunset'],modes=['light','dark','system'];
 function normalize(value){return {palette:palettes.includes(value?.palette)?value.palette:'emerald',mode:modes.includes(value?.mode)?value.mode:'system'};}
 const api={normalize,palettes,modes,key:'profitpilot.appearance.v1'};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 let value;try{value=JSON.parse(localStorage.getItem(api.key));}catch{}
 api.value=normalize(value);const system=matchMedia('(prefers-color-scheme: dark)');
 api.apply=()=>{const p=api.value;document.documentElement.dataset.palette=p.palette;document.documentElement.dataset.theme=p.mode==='system'?(system.matches?'dark':'light'):p.mode;document.documentElement.style.colorScheme=document.documentElement.dataset.theme;};
 api.save=next=>{api.value=normalize(next);api.apply();try{localStorage.setItem(api.key,JSON.stringify(api.value));return true;}catch{return false;}};
 system.addEventListener('change',()=>{api.apply();window.dispatchEvent(new Event('appearancechange'));});
 api.apply();root.PPAppearance=api;
})(globalThis);
