'use strict';
// Desktop author UI only; the TV renderer and LAN transport remain separate.
const styles = `
#shareDialog { box-sizing:border-box; width:min(640px,calc(100vw - 24px)); max-height:calc(100dvh - 24px); overflow:auto; padding:28px; border:1px solid #59614f; border-radius:16px; background:#1b1e18; color:#f2f1e8; box-shadow:0 20px 80px #0009; font:15px/1.5 sans-serif; }
#shareDialog::backdrop { background:rgba(0,0,0,.76); }
#shareDialog h2 { margin:0; font-size:26px; line-height:1.2; }
#shareDialog p { margin:10px 0; }
#shareSnapshot { color:#cde3aa; font-weight:600; }
#shareDialog ol { padding-left:24px; }
#shareDialog .share-steps>li { margin:16px 0; padding-left:4px; }
#shareDialog #shareAddresses { padding-left:24px; margin-top:8px; font:600 21px/1.6 monospace; }
#sharePin { display:block; margin:10px 0; padding:14px; border:1px solid #6a7956; border-radius:8px; background:#11170c; color:#deefc6; font:700 clamp(32px,9vw,48px)/1.2 monospace; letter-spacing:.14em; text-align:center; }
#shareDialog .share-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
#shareDialog button { min-height:40px; padding:9px 14px; border:1px solid #73805e; border-radius:7px; color:#f2f1e8; background:#35412b; font:inherit; cursor:pointer; }
#shareDialog button:focus-visible,#shareDialog summary:focus-visible { outline:2px solid #d4ebaf; outline-offset:3px; }
#shareDialog button:disabled { opacity:.55; cursor:wait; }
#shareDialogStatus { color:#e5d5b7; }
#shareDialog details { margin-top:16px; border-top:1px solid #3f4837; padding-top:12px; }
#shareDialog summary { cursor:pointer; }
#shareDialog .share-note { color:#bdc5b2; font-size:13px; }
@media(max-width:420px) { #shareDialog { padding:20px; } #shareDialog h2 { font-size:23px; } }
`;
const html = `<dialog id="shareDialog" aria-labelledby="shareDialogTitle" aria-describedby="shareDialogStatus">
<h2 id="shareDialogTitle">Установить тему на ТВ</h2>
<p id="shareSnapshot"></p><p id="shareDialogStatus" role="status" aria-live="polite"></p>
<div id="shareInstructions" hidden>
<ol class="share-steps">
<li><strong>Подключите компьютер и ТВ к одной домашней сети.</strong> Подойдёт Wi-Fi или кабель к одному роутеру. Оставьте компьютер включённым и не закрывайте терминал.</li>
<li><strong>На ТВ откройте Настройки → Темы → Получить с компьютера.</strong> Введите один из адресов компьютера ниже — без ссылки и номера порта:<ol id="shareAddresses"></ol><p id="shareNoAddress" hidden>Домашний IP не найден. Подключите компьютер к домашней сети и нажмите «Новый PIN».</p></li>
<li><strong>Введите шестизначный PIN на ТВ:</strong><output id="sharePin" aria-label="PIN для телевизора"></output><p id="shareExpiry" class="share-note"></p></li>
<li>На ТВ нажмите <strong>«Получить тему»</strong>, затем <strong>«Применить тему»</strong>. Установленная тема сохранится сразу.</li>
</ol>
</div>
<p class="share-note">Закрытие этого окна не останавливает передачу. После правок темы нажмите «Новый PIN»: он создаст новый снимок файлов. Send to TV повторно открывает эту инструкцию. Для другой выбранной темы создаётся новая передача.</p>
<details><summary>Не получается подключиться?</summary><p>Если на ТВ нет пункта «Темы», установите версию Home с поддержкой тем. Если адресов несколько, попробуйте адрес сети, к которой подключён ТВ. Гостевая Wi-Fi сеть или изоляция устройств может мешать подключению.</p><p>Разрешите Node.js входящие подключения в брандмауэре компьютера: TCP 8879. Не открывайте этот порт в интернет на роутере. Проверьте адрес и PIN, оставьте передачу включённой и попробуйте снова.</p></details>
<div class="share-actions"><button id="shareNewPin" type="button">Новый PIN</button><button id="shareDialogStop" type="button" hidden>Остановить передачу</button><button id="shareDialogClose" type="button" autofocus>Закрыть</button></div>
</dialog>`;
function client(onLayout) {
  var dialog=document.getElementById('shareDialog'),send=document.getElementById('sendToTV'),stop=document.getElementById('stopShare'),summary=document.getElementById('shareStatus'),status=document.getElementById('shareDialogStatus'),instructions=document.getElementById('shareInstructions'),pin=document.getElementById('sharePin'),snapshot=document.getElementById('shareSnapshot'),renew=document.getElementById('shareNewPin'),dialogStop=document.getElementById('shareDialogStop'),timer,pending=false,live=false,sessionKey;
  function selectedKey(){var selected=document.querySelector('[data-key][aria-pressed="true"]');return selected?selected.dataset.key:'single';}
  function active(value){live=value;stop.hidden=!value;dialogStop.hidden=!value;}
  function expired(){active(false);instructions.hidden=true;pin.textContent='';status.textContent='Срок PIN истёк. Нажмите «Новый PIN», чтобы продолжить.';summary.textContent='Срок PIN истёк — откройте Send to TV.';if(onLayout)onLayout();}
  function friendly(error){return /Classic is built in/.test(error)?'Classic уже встроена в ТВ. Выберите Alpine или другую тему для передачи.':error;}
  function request(route){
    if(pending)return;var requestKey=selectedKey();pending=true;clearTimeout(timer);active(false);instructions.hidden=true;pin.textContent='';snapshot.textContent='';renew.disabled=true;status.textContent=route.endsWith('/stop')?'Останавливаем передачу…':'Создаём снимок выбранной темы…';summary.textContent=status.textContent;
    fetch(route,{method:'POST'}).then(function(response){return response.json();}).then(function(result){
      if(result.error){status.textContent=friendly(result.error);summary.textContent=status.textContent;return;}
      if(result.stopped){status.textContent='Передача остановлена. Для новой установки нажмите «Новый PIN».';summary.textContent='Передача остановлена.';return;}
      sessionKey=requestKey;active(true);timer=setTimeout(expired,Math.max(0,result.expiresAt-Date.now()));snapshot.textContent='Тема: '+result.title;if(!result.addresses.length){status.textContent='Домашний IP не найден. Подключите компьютер к домашней сети и нажмите «Новый PIN».';summary.textContent=status.textContent;return;}status.textContent='Снимок готов. Выполните шаги на телевизоре.';instructions.hidden=false;pin.textContent=result.pin;
      var addresses=document.getElementById('shareAddresses');addresses.textContent='';result.addresses.forEach(function(address){var li=document.createElement('li');li.textContent=address;addresses.appendChild(li);});document.getElementById('shareNoAddress').hidden=result.addresses.length>0;
      document.getElementById('shareExpiry').textContent='PIN действует 10 минут, до '+new Date(result.expiresAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'. Не переводите компьютер в сон.';
      summary.textContent=result.title+' · Передача включена на 10 минут. Инструкция — Send to TV.';
    }).catch(function(error){active(false);instructions.hidden=true;status.textContent='Не удалось создать передачу: '+error.message;summary.textContent=status.textContent;}).then(function(){pending=false;renew.disabled=false;if(onLayout)onLayout();});
  }
  send.onclick=function(){if(!dialog.open)dialog.showModal();if(!live||sessionKey!==selectedKey())request('/theme-share');};
  stop.onclick=function(){if(!dialog.open)dialog.showModal();request('/theme-share/stop');};
  renew.onclick=function(){request('/theme-share');};dialogStop.onclick=function(){request('/theme-share/stop');};
  document.getElementById('shareDialogClose').onclick=function(){dialog.close();};
  dialog.addEventListener('close',function(){send.focus();});
}
module.exports={styles,html,client};
