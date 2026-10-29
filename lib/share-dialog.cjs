'use strict';
// Desktop author UI only; the TV renderer and LAN transport remain separate.
const styles = `
#shareDialog { box-sizing:border-box; width:min(640px,calc(100vw - 24px)); max-height:calc(100dvh - 24px); overflow:auto; padding:28px; border:1px solid #59614f; border-radius:16px; background:#1b1e18; color:#f2f1e8; box-shadow:0 20px 80px #0009; font:15px/1.5 sans-serif; }
#shareDialog::backdrop { background:rgba(0,0,0,.76); }
#shareDialog h2 { margin:0; font-size:26px; line-height:1.2; }
#shareDialog [hidden] { display:none !important; }
#shareDialog p { margin:10px 0; }
#shareSnapshot { color:#cde3aa; font-weight:600; }
#shareDialog ol { padding-left:24px; }
#shareDialog .share-steps>li { margin:16px 0; padding-left:4px; }
#shareDialog #shareAddresses { padding-left:24px; margin-top:8px; font:600 21px/1.6 monospace; }
#sharePin { display:block; margin:10px 0; padding:14px; border:1px solid #6a7956; border-radius:8px; background:#11170c; color:#deefc6; font:700 clamp(32px,9vw,48px)/1.2 monospace; letter-spacing:.14em; text-align:center; }
#shareDialog .share-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
#shareDialog label { display:block; margin-bottom:4px; }
#shareDialog input { box-sizing:border-box; width:100%; min-height:44px; padding:8px; border:1px solid #73805e; border-radius:6px; background:#11170c; color:#f2f1e8; font:18px monospace; }
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
<h2 id="shareDialogTitle">Send theme to TV</h2>
<p id="shareBuiltinNotice" hidden>Classic is already included on your TV. Choose another theme in the preview to send it.</p>
<ol class="share-steps"><li>Connect your TV and computer to the same home network.</li>
<li><strong>On TV, open Settings → Appearance → Receive from computer.</strong> Keep this screen open. It shows your TV address and a temporary six-digit PIN.</li>
<li>Enter those values on this computer:<form id="sendThemeForm">
<p><label for="sendTVAddress">TV address</label><input id="sendTVAddress" name="tv" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="192.168.1.20" required></p>
<p><label for="sendTVPin">PIN shown on TV</label><input id="sendTVPin" name="pin" inputmode="numeric" type="password" autocomplete="off" pattern="[0-9]{6}" minlength="6" maxlength="6" required></p>
<button id="shareSendTheme" type="submit">Send theme</button></form></li>
<li>After sending, finish installation on TV and choose <strong>Apply theme</strong>.</li></ol>
<p id="shareDialogStatus" role="status" aria-live="polite">Ready. Enter the address and PIN shown on TV.</p>
<details><summary>Connection help and legacy sharing</summary><p>Check the TV address and PIN. Reopen Receive from computer if its session expired. Guest Wi-Fi or device isolation may block communication.</p><p>This sends an outgoing connection from your computer. No inbound computer firewall change is needed. Do not forward the TV port to the internet.</p><p>For older candidates that ask for a computer address, use the secondary CLI command <code>npm run theme -- share DIRECTORY --runtime PATH</code>. This legacy method requires incoming connections to your computer.</p></details>
<div class="share-actions"><button id="shareDialogClose" type="button">Close</button></div></dialog>`;
function client(onLayout) {
  var dialog=document.getElementById('shareDialog'),send=document.getElementById('sendToTV'),summary=document.getElementById('shareStatus'),status=document.getElementById('shareDialogStatus'),button=document.getElementById('shareSendTheme'),address=document.getElementById('sendTVAddress'),pin=document.getElementById('sendTVPin'),pending=false;
  send.onclick=function(){
    var classic=document.querySelector('#themePicker [data-theme-id="builtin:classic"][aria-pressed="true"]');
    document.getElementById('shareBuiltinNotice').hidden=!classic;
    dialog.querySelector('.share-steps').hidden=!!classic;
    status.hidden=!!classic;dialog.querySelector('details').hidden=!!classic;
    if(!pending){status.textContent='Ready. Enter the address and PIN shown on TV.';summary.textContent='';}
    if(!dialog.open)dialog.showModal();
  };
  document.getElementById('sendThemeForm').onsubmit=function(event){
    event.preventDefault();if(pending)return;pending=true;button.disabled=true;address.disabled=true;pin.disabled=true;status.textContent='Preparing and sending the selected theme…';summary.textContent='Sending…';
    fetch('/theme-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tv:address.value,pin:pin.value})}).then(function(response){return response.json();}).then(function(result){
      if(result.sent){status.textContent='Sent. Finish installation on TV, then choose Apply theme.';summary.textContent='Sent — finish on TV';pin.value='';}
      else {status.textContent=result.error||'Could not send theme. Check the TV receiver and retry.';summary.textContent='Send failed';}
    }).catch(function(){status.textContent='Could not send theme. Check the TV receiver and retry.';summary.textContent='Send failed';}).then(function(){pending=false;button.disabled=false;address.disabled=false;pin.disabled=false;button.textContent='Send theme';if(onLayout)onLayout();});
  };
  document.getElementById('shareDialogClose').onclick=function(){dialog.close();};
  dialog.addEventListener('close',function(){pin.value='';send.focus();});
}
module.exports={styles,html,client};
