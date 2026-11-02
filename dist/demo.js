async function preview(event){event.preventDefault();event.stopImmediatePropagation();if(document.querySelector('input[type="date"]')&&!window.osteCheckDate)return;if(window.osteCheckDate&&!await window.osteCheckDate())return;document.getElementById('demo-dialog').showModal();}
document.addEventListener('submit',preview,true);
document.getElementById('close-demo')?.addEventListener('click',()=>document.getElementById('demo-dialog').close());
document.querySelectorAll('[data-disabled-contact]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.getElementById('demo-dialog').showModal();}));
document.querySelectorAll('.brz-btn-submit').forEach(button=>{button.type='button';button.textContent='Afprøv formular';button.addEventListener('click',preview);});
