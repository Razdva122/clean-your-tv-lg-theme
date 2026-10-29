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
<h2 id="shareDialogTitle">Install theme on TV</h2>
<p id="shareSnapshot"></p><p id="shareDialogStatus" role="status" aria-live="polite"></p>
<div id="shareInstructions" hidden><ol class="share-steps">
<li><strong>Connect your computer and TV to the same home network.</strong> Use Wi-Fi or Ethernet on the same router. Keep your computer awake and its terminal open.</li>
<li><strong>On TV, open Settings → Appearance → Receive from computer.</strong> Enter one computer address below, without a URL or port:<ol id="shareAddresses"></ol><p id="shareNoAddress" hidden>No home-network IP found. Connect to your home network and choose New PIN.</p></li>
<li><strong>Enter this six-digit PIN on TV:</strong><output id="sharePin" aria-label="TV pairing PIN"></output><p id="shareExpiry" class="share-note"></p></li>
<li>On TV, choose <strong>Receive theme</strong>, then <strong>Apply theme</strong>. The installed theme is saved immediately.</li>
</ol></div>
<p class="share-note">Closing this guide keeps sharing active. After editing your theme, choose New PIN to create a fresh snapshot. Send to TV reopens this guide. Selecting another theme starts a new session.</p>
<details><summary>Connection help</summary><p>If Themes is missing on TV, install a Home version that supports themes. If several addresses are listed, try the one on your TV's network. Guest Wi-Fi or device isolation can block the connection.</p><p>Allow Node.js inbound TCP 8879 through your computer's firewall. Do not forward this port to the internet. Check the address and PIN, keep sharing active, and try again.</p></details>
<div class="share-actions"><button id="shareNewPin" type="button">New PIN</button><button id="shareDialogStop" type="button" hidden>Stop sharing</button><button id="shareDialogClose" type="button" autofocus>Close</button></div>
</dialog>`;
function client(onLayout) {
  var dialog=document.getElementById('shareDialog'),send=document.getElementById('sendToTV'),stop=document.getElementById('stopShare'),summary=document.getElementById('shareStatus'),status=document.getElementById('shareDialogStatus'),instructions=document.getElementById('shareInstructions'),pin=document.getElementById('sharePin'),snapshot=document.getElementById('shareSnapshot'),renew=document.getElementById('shareNewPin'),dialogStop=document.getElementById('shareDialogStop'),timer,pending=false,live=false,sessionKey;
  function selectedKey(){var selected=document.querySelector('[data-key][aria-pressed="true"]');return selected?selected.dataset.key:'single';}
  function active(value){live=value;stop.hidden=!value;dialogStop.hidden=!value;}
  function expired(){active(false);instructions.hidden=true;pin.textContent='';status.textContent='This PIN has expired. Choose New PIN to continue.';summary.textContent='PIN expired';if(onLayout)onLayout();}
  function friendly(error){return /Classic is built in/.test(error)?'Classic is already built into your TV. Select Alpine or another local theme to share.':error;}
  function request(route){
    if(pending)return;var requestKey=selectedKey();pending=true;clearTimeout(timer);active(false);instructions.hidden=true;pin.textContent='';snapshot.textContent='';renew.disabled=true;status.textContent=route.endsWith('/stop')?'Stopping sharing…':'Preparing the selected theme…';summary.textContent=route.endsWith('/stop')?'Stopping…':'Preparing…';if(onLayout)onLayout();
    fetch(route,{method:'POST'}).then(function(response){return response.json();}).then(function(result){
      if(result.error){status.textContent=friendly(result.error);summary.textContent='Sharing unavailable';return;}
      if(result.stopped){status.textContent='Sharing stopped. Choose New PIN to start again.';summary.textContent='Sharing stopped';return;}
      sessionKey=requestKey;active(true);timer=setTimeout(expired,Math.max(0,result.expiresAt-Date.now()));snapshot.textContent='Theme: '+result.title;if(!result.addresses.length){status.textContent='No home-network IP found. Connect your computer to your home network and choose New PIN.';summary.textContent='Sharing unavailable';return;}status.textContent='Your snapshot is ready. Follow these steps on TV.';instructions.hidden=false;pin.textContent=result.pin;
      var addresses=document.getElementById('shareAddresses');addresses.textContent='';result.addresses.forEach(function(address){var li=document.createElement('li');li.textContent=address;addresses.appendChild(li);});document.getElementById('shareNoAddress').hidden=result.addresses.length>0;
      document.getElementById('shareExpiry').textContent='PIN expires in 10 minutes, at '+new Date(result.expiresAt).toLocaleTimeString('en',{ hour:'2-digit',minute:'2-digit'})+'. Keep your computer awake.';
      summary.textContent='Sharing '+result.title;
    }).catch(function(error){active(false);instructions.hidden=true;status.textContent='Could not start sharing: '+error.message;summary.textContent='Sharing unavailable';}).then(function(){pending=false;renew.disabled=false;if(onLayout)onLayout();});
  }
  send.onclick=function(){if(!dialog.open)dialog.showModal();if(!live||sessionKey!==selectedKey())request('/theme-share');};
  stop.onclick=function(){if(!dialog.open)dialog.showModal();request('/theme-share/stop');};
  renew.onclick=function(){request('/theme-share');};dialogStop.onclick=function(){request('/theme-share/stop');};
  document.getElementById('shareDialogClose').onclick=function(){dialog.close();};
  dialog.addEventListener('close',function(){send.focus();});
}
module.exports={styles,html,client};
