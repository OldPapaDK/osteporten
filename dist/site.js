(async()=>{
const kind=location.pathname.includes('tapas-bestilling')?'tapas':location.pathname.includes('sandwich-bestilling')?'sandwich':null;
const input=document.querySelector('input[type="date"]');let picker,state;
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen'}).format(new Date());
const refresh=async()=>{const r=await fetch('/api/site',{cache:'no-store'});if(!r.ok)throw Error('Kalenderen kunne ikke hentes. Prøv igen om lidt.');state=await r.json();return state;};
if(input){input.disabled=true;const hint=document.createElement('p');hint.id='calendar-status';hint.setAttribute('role','status');hint.style.cssText='font:15px/1.5 system-ui;color:#484f3c;padding:8px 0';hint.textContent='Henter ledige datoer …';input.after(hint);input.setAttribute('aria-describedby',hint.id);}
try{
 await refresh();
 document.querySelectorAll('[data-cms-key]').forEach(el=>{const value=state.texts[el.dataset.cmsKey];if(el.hasAttribute('data-cms-hide-empty')&&typeof value==='string')el.hidden=!value.trim();if(typeof value==='string'&&value!==el.dataset.cmsDefault){el.textContent=value;el.style.whiteSpace='pre-line';}});
 if(input&&kind){input.disabled=false;picker=flatpickr(input,{locale:'da',dateFormat:'Y-m-d',altInput:true,altFormat:'j. F Y',disableMobile:true,minDate:today(),disable:[d=>{const date=flatpickr.formatDate(d,'Y-m-d');return date<=today()||state.blocked[kind].includes(date);}],onOpen:async()=>{try{await refresh();picker.redraw();}catch(e){document.getElementById('calendar-status').textContent=e.message;picker.close();}}});document.getElementById('calendar-status').textContent='Lukkede dage er grå og kan ikke vælges. Bestilling til i dag skal ske pr. telefon.';}
}catch(e){if(input)document.getElementById('calendar-status').textContent=e.message;}
window.osteCheckDate=async()=>{
 if(!kind||!input)return true;
 if(!input.value){document.getElementById('calendar-status').textContent='Vælg en ledig afhentningsdato.';picker?.open();return false;}
 try{const r=await fetch('/api/site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,date:input.value})});const data=await r.json();if(!r.ok){document.getElementById('calendar-status').textContent=data.error||'Datoen kunne ikke kontrolleres.';await refresh();picker?.clear();picker?.redraw();return false;}return true;}catch{document.getElementById('calendar-status').textContent='Datoen kunne ikke kontrolleres. Prøv igen om lidt.';return false;}
};
})();
