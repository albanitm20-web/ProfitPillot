/* Native category picker remains usable on iOS; custom categories stay editable. */
(function(){
 const input=$('entry-category'),label=$('category-field'),source=$('category-list');
 label.htmlFor=input.id;
 const field=document.createElement('span');field.className='category-input';
 input.before(field);field.append(input);input.removeAttribute('list');
 const select=document.createElement('select');select.id='category-picker';select.setAttribute('aria-label','Pilih kategori dari daftar');
 const arrow=document.createElement('span');arrow.className='category-picker-arrow';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 field.append(select,arrow);
 function options(){select.replaceChildren(new Option('Pilih kategori',''));for(const option of source.options)select.add(new Option(option.value,option.value));}
 new MutationObserver(options).observe(source,{childList:true});options();
 select.addEventListener('change',()=>{if(!select.value)return;input.value=select.value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));select.value='';});
})();
