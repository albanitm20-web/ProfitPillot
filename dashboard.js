/* Switch presentation in place; never call save(), setMode(), or replace state. */
(function(){
 const settings=$('settings-dialog'),section=document.createElement('section');
 section.className='dashboard-settings';
 section.innerHTML='<h3>Gaya Dashboard</h3><p>Bandingkan susunannya, lalu pilih. Semua catatan tetap sama.</p><div class="dashboard-choices" role="group" aria-label="Gaya Dashboard">'+['classic','modern'].map(style=>'<button type="button" class="button dashboard-choice" data-dashboard-choice="'+style+'" aria-pressed="false"><span class="dashboard-mini '+style+'" aria-hidden="true"><i></i><b></b><b></b><b></b><em></em><em></em></span><strong>'+ (style==='classic'?'Classic':'Modern')+'</strong><small>'+(style==='classic'?'Menu mendatar, ringkasan sederhana, dan catatan terbaru.':'Navigasi samping, saldo utama, grafik dan rencana keuangan.')+'</small><span class="dashboard-choice-action">Gunakan tampilan ini</span></button>').join('')+'</div><p class="muted">Pilihan berlaku di browser ini untuk catatan pribadi dan bisnis. Di perangkat lain, pilih kembali gaya yang kamu inginkan.</p>';
 settings.querySelector('h3').before(section);
 const quick=document.createElement('button');quick.type='button';quick.id='dashboard-switch';quick.className='quiet';quick.textContent='Ganti tampilan';quick.onclick=()=>{settings.showModal();section.scrollIntoView({block:'nearest'});};
 $('period-bar').append(quick);
 const action=$('new-entry'),workspace=document.querySelector('.workspace-bar');
 function sync(){
  const classic=PPDashboard.value.dashboardStyle==='classic';
  if(classic)workspace.append(action);else $('period-bar').insertBefore(action,quick);
  settings.querySelectorAll('[data-dashboard-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dashboardChoice===PPDashboard.value.dashboardStyle)));
 }
 section.addEventListener('click',event=>{const button=event.target.closest('[data-dashboard-choice]');if(!button)return;
  const saved=PPDashboard.save({dashboardStyle:button.dataset.dashboardChoice});sync();render();
  $('appearance-feedback').textContent=saved?'Dashboard '+button.querySelector('strong').textContent+' dipilih. Catatan dan filter tetap sama.':'Tampilan berubah untuk sesi ini. Browser tidak mengizinkan penyimpanan.';
 });
 addEventListener('dashboardchange',()=>{sync();render();});sync();render();
})();
