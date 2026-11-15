/* UI only. Classic is the conservative default on every unconfigured device. */
(function(root){
 const key='profitpilot.dashboard.v1';
 const normalize=value=>({version:1,dashboardStyle:value?.dashboardStyle==='modern'?'modern':'classic'});
 const api={key,normalize};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 let stored;try{stored=JSON.parse(localStorage.getItem(key));}catch{}
 api.value=normalize(stored);
 api.apply=()=>document.documentElement.dataset.dashboard=api.value.dashboardStyle;
 api.save=value=>{api.value=normalize(value);api.apply();try{localStorage.setItem(key,JSON.stringify(api.value));return true;}catch{return false;}};
 api.apply();root.PPDashboard=api;
 // Only UI preferences are shared across tabs. No account or ledger mutations.
 addEventListener('storage',event=>{if(event.key!==key)return;try{api.value=normalize(JSON.parse(event.newValue));}catch{api.value=normalize(null);}api.apply();dispatchEvent(new Event('dashboardchange'));});
})(globalThis);
