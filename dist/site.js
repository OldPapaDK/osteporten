(async()=>{
const kind=location.pathname.includes('tapas-bestilling')?'tapas':location.pathname.includes('sandwich-bestilling')?'sandwich':null;
const input=document.querySelector('input[type="date"]');let picker,state;
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen'}).format(new Date());
const refresh=async()=>{const r=await fetch('/api/site',{cache:'no-store'});if(!r.ok)throw Error('Kalenderen kunne ikke hentes. Prøv igen om lidt.');state=await r.json();return state;};
if(input){input.disabled=true;const hint=document.createElement('p');hint.id='calendar-status';hint.setAttribute('role','status');hint.style.cssText='font:15px/1.5 system-ui;color:#484f3c;padding:8px 0';hint.textContent='Henter ledige datoer …';input.after(hint);input.setAttribute('aria-describedby',hint.id);}
try{
 await refresh();
 applyImages();
 document.querySelectorAll('[data-cms-key]').forEach(el=>{const value=state.texts[el.dataset.cmsKey];if(el.hasAttribute('data-cms-hide-empty')&&typeof value==='string')el.hidden=!value.trim();if(typeof value==='string'&&value!==el.dataset.cmsDefault){el.textContent=value;el.style.whiteSpace='pre-line';}});
 if(input&&kind){input.disabled=false;picker=flatpickr(input,{locale:'da',dateFormat:'Y-m-d',altInput:true,altFormat:'j. F Y',disableMobile:true,minDate:today(),disable:[d=>{const date=flatpickr.formatDate(d,'Y-m-d');return date<=today()||state.blocked[kind].includes(date)||((state.closedWeekdays||[0,1,2]).includes(d.getDay())&&!(state.opened?.[kind]||[]).includes(date));}],onOpen:async()=>{try{await refresh();picker.redraw();}catch(e){document.getElementById('calendar-status').textContent=e.message;picker.close();}}});document.getElementById('calendar-status').textContent='Søndag, mandag og tirsdag er normalt lukket. Ekstra åbne dage kan vælges i kalenderen. Bestilling til i dag skal ske pr. telefon.';}
}catch(e){if(input)document.getElementById('calendar-status').textContent=e.message;}
function applyImages(){
 const images=state.images||{};
 document.querySelectorAll('[data-cms-image]').forEach(el=>{const id=el.dataset.cmsImage;if(!images[id])return;el.removeAttribute('srcset');el.src='/api/image?id='+encodeURIComponent(id)+'&v='+state.revision;el.closest('picture')?.querySelectorAll('source').forEach(source=>source.removeAttribute('srcset'));});
 if(!Object.keys(images).length)return;
 fetch('/admin/images.json').then(r=>r.json()).then(catalog=>{const replacements=catalog.filter(x=>images[x.id]);function replace(value){for(const item of replacements)value=value.split(item.src).join('/api/image?id='+item.id+'&v='+state.revision);return value;}function rules(list){for(const rule of list){if(rule.style?.backgroundImage)rule.style.backgroundImage=replace(rule.style.backgroundImage);if(rule.cssRules)rules(rule.cssRules);}}for(const sheet of document.styleSheets){try{rules(sheet.cssRules);}catch{}}document.querySelectorAll('[style]').forEach(el=>{if(el.style.backgroundImage)el.style.backgroundImage=replace(el.style.backgroundImage);});});
}
window.osteCheckDate=async()=>{
 if(!kind||!input)return true;
 if(!input.value){document.getElementById('calendar-status').textContent='Vælg en ledig afhentningsdato.';picker?.open();return false;}
 try{const r=await fetch('/api/site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,date:input.value})});const data=await r.json();if(!r.ok){document.getElementById('calendar-status').textContent=data.error||'Datoen kunne ikke kontrolleres.';await refresh();picker?.clear();picker?.redraw();return false;}return true;}catch{document.getElementById('calendar-status').textContent='Datoen kunne ikke kontrolleres. Prøv igen om lidt.';return false;}
};
})();

