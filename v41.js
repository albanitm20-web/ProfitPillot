/* V4.1 presentation: financial calculations continue to use the existing ledger. */
(function(){
 const appearance=PPAppearance;
 const settings=document.createElement('dialog');settings.id='settings-dialog';settings.setAttribute('aria-labelledby','settings-title');
 settings.innerHTML='<div class="dialog-head"><div><span class="eyebrow">BUAT SENYAMANMU</span><h2 id="settings-title">Pengaturan tampilan</h2></div><button class="close" data-close="settings-dialog" aria-label="Tutup pengaturan">×</button></div><h3>Warna pilihan</h3><div class="appearance-options" aria-label="Warna tema">'+[['emerald','Emerald Green'],['ocean','Ocean Blue'],['purple','Royal Purple'],['rose','Rose Pink'],['sunset','Sunset Orange']].map(([id,label])=>'<button type="button" class="button" data-palette-choice="'+id+'" aria-pressed="false"><span class="swatch '+id+'" aria-hidden="true"></span>'+label+'</button>').join('')+'</div><h3>Mode tampilan</h3><div class="appearance-options mode-options" aria-label="Mode tampilan">'+[['light','Terang'],['dark','Gelap'],['system','Ikuti Sistem']].map(([id,label])=>'<button type="button" class="button" data-mode-choice="'+id+'" aria-pressed="false">'+label+'</button>').join('')+'</div><p>Pilihan berlaku di browser ini. Catatan keuangan dan akunmu tidak berubah.</p><p id="appearance-feedback" role="status" aria-live="polite"></p>';
 document.body.append(settings);
 const button=document.createElement('button');button.className='quiet';button.id='settings-open';button.textContent='Pengaturan';document.querySelector('.top').append(button);
 const moreButton=document.createElement('button');moreButton.className='button';moreButton.textContent='Pengaturan tampilan';document.querySelector('#more-dialog .more-grid').append(moreButton);
 function open(){if($('more-dialog').open)$('more-dialog').close();settings.showModal();}
 button.addEventListener('click',open);moreButton.addEventListener('click',open);
 function update(){
  settings.querySelectorAll('[data-palette-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paletteChoice===appearance.value.palette)));
  settings.querySelectorAll('[data-mode-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modeChoice===appearance.value.mode)));
  const root=getComputedStyle(document.documentElement),host=$('calculator-host');
  const tokens={ink:'ink',muted:'muted',line:'line',surface:'surface',tint:'tint',red:'red',bg:'background',primary:'primary',alt:'surface-alt',hero:'hero','on-accent':'on-accent','danger-bg':'danger-bg'};
  Object.entries(tokens).forEach(([name,source])=>host.style.setProperty('--app-'+name,root.getPropertyValue('--'+source).trim()));
  document.querySelector('meta[name="theme-color"]').content=root.getPropertyValue('--surface').trim();
 }
 settings.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||(!b.dataset.paletteChoice&&!b.dataset.modeChoice))return;
  const saved=appearance.save({...appearance.value,...(b.dataset.paletteChoice?{palette:b.dataset.paletteChoice}:{mode:b.dataset.modeChoice})});update();$('appearance-feedback').textContent=saved?'Tampilan tersimpan di browser ini.':'Tampilan berubah, tetapi browser tidak mengizinkan penyimpanan. Pilih lagi setelah refresh.';
 });window.addEventListener('appearancechange',update);update();
 const chart=document.createElement('section');chart.className='card daily-chart';chart.id='daily-cash-chart';$('summary-panel').insertBefore(chart,$('summary-panel').querySelector('.two-col'));
 function renderDaily(){
  const end=today(),rows=PP.ledger(state).rows.filter(r=>r.book===mode);let days=[];
  for(let offset=6;offset>=0;offset--){const date=new Date(end+'T12:00:00');date.setDate(date.getDate()-offset);const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');const selected=rows.filter(r=>r.date===key);days.push({date:key,label:date.toLocaleDateString('id-ID',{weekday:'short'}),incoming:selected.reduce((s,r)=>s+Math.max(r.cash,0),0),outgoing:selected.reduce((s,r)=>s+Math.max(-r.cash,0),0)});}
  const max=Math.max(1,...days.flatMap(d=>[d.incoming,d.outgoing]));
  chart.innerHTML='<div class="section-head"><div><span class="eyebrow">7 HARI TERAKHIR</span><h2>Arus kas harian</h2><p class="muted">'+displayDate(days[0].date)+' – '+displayDate(end)+'</p></div><button class="quiet" data-go="report">Lihat laporan →</button></div><div class="daily-columns" aria-hidden="true">'+days.map(d=>'<div class="daily-day"><div class="daily-pair"><i style="height:'+d.incoming/max*100+'%"></i><i style="height:'+d.outgoing/max*100+'%"></i></div><span>'+d.label+'</span></div>').join('')+'</div><div class="chart-key"><span>Kas masuk · bulat</span><span>Kas keluar · persegi</span></div><details><summary>Lihat angka per hari</summary><table><thead><tr><th>Tanggal</th><th>Kas masuk</th><th>Kas keluar</th></tr></thead><tbody>'+days.map(d=>'<tr><th scope="row">'+displayDate(d.date)+'</th><td>'+money(d.incoming)+'</td><td>'+money(d.outgoing)+'</td></tr>').join('')+'</tbody></table></details><p class="weekly-note">'+(days.some(d=>d.incoming||d.outgoing)?'':'Belum ada pergerakan kas dalam tujuh hari terakhir. ')+'Kas neto per transaksi, termasuk saldo awal dan pinjaman. Grafik ini tidak mengikuti filter bulan dan bukan laporan laba.</p>';
 }
 new MutationObserver(renderDaily).observe($('summary-stats'),{childList:true});renderDaily();
})();
