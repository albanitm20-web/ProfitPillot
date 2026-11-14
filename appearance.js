/* Applied before paint; no financial data is read or changed. */
(function(root){
 const palettes=['emerald','ocean','purple','rose','sunset'],modes=['light','dark','system'];
 function normalize(value){return {palette:palettes.includes(value?.palette)?value.palette:'emerald',mode:modes.includes(value?.mode)?value.mode:'system',compact:value?.compact===true,reducedMotion:value?.reducedMotion===true,layout:value?.layout==='productivity'?'productivity':'editorial'};}
 const api={normalize,palettes,modes,key:'profitpilot.appearance.v1'};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 let value;try{value=JSON.parse(localStorage.getItem(api.key));}catch{}
 api.value=normalize(value);const system=matchMedia('(prefers-color-scheme: dark)');
 api.apply=()=>{const p=api.value,root=document.documentElement;root.dataset.palette=p.palette;root.dataset.theme=p.mode==='system'?(system.matches?'dark':'light'):p.mode;root.dataset.density=p.compact?'compact':'comfortable';root.dataset.motion=p.reducedMotion?'reduced':'auto';root.dataset.concept=p.layout;root.style.colorScheme=root.dataset.theme;};
 api.save=next=>{api.value=normalize(next);api.apply();try{localStorage.setItem(api.key,JSON.stringify(api.value));return true;}catch{return false;}};
 system.addEventListener('change',()=>{api.apply();window.dispatchEvent(new Event('appearancechange'));});
 api.apply();root.PPAppearance=api;
})(globalThis);
