import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
export const fingerprint=x=>createHash('sha256').update(x).digest('hex');
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function verifyPassword(password,hash){try{const [salt,key]=hash.split(':');const actual=scryptSync(password,salt,64);const expected=Buffer.from(key,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}catch{return false;}}
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen'}).format(new Date());}
export const closedWeekdays=[0,1,2];
export function available(state,kind,date){if(!['tapas','sandwich'].includes(kind)||!validDate(date)||date<=today()||state.blocked[kind].includes(date))return false;return !closedWeekdays.includes(new Date(date+'T12:00:00Z').getUTCDay())||(state.opened?.[kind]||[]).includes(date);}
export function validateSettings(body,defaults){
 if(!body||typeof body.texts!=='object'||!body.blocked)throw Error('Ugyldige indstillinger.');
 const texts={};for(const key of Object.keys(defaults)){if(typeof body.texts[key]!=='string'||body.texts[key].length>6000)throw Error('En tekst er ugyldig eller for lang.');texts[key]=body.texts[key];}
 const blocked={};for(const kind of ['tapas','sandwich']){const dates=body.blocked[kind];if(!Array.isArray(dates)||dates.length>1500||!dates.every(validDate))throw Error('Ugyldige datoer.');blocked[kind]=[...new Set(dates)].sort();}
 const opened={};for(const kind of ['tapas','sandwich']){const dates=body.opened?.[kind];if(!Array.isArray(dates)||dates.length>1500||!dates.every(validDate))throw Error('Kalenderen er ændret. Genindlæs siden og prøv igen.');opened[kind]=[...new Set(dates)].filter(d=>!blocked[kind].includes(d)).sort();}
 return {texts,blocked,opened};
}
