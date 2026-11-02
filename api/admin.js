import {uploadImage,validateImages} from '../lib/images.js';
import {sealData,unsealData} from 'iron-session';
import {hashPassword,verifyPassword,fingerprint,validateSettings} from '../lib/core.js';
import {readState,readBlob,writeBlob,publicState,defaults} from '../lib/store.js';
import {prepare,fail} from '../lib/http.js';
const cookieName='__Host-osteporten';
function cookie(res,value,maxAge){res.setHeader('Set-Cookie',`${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);}
async function session(req,state){const raw=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!raw)return false;const data=await unsealData(raw,{password:process.env.SESSION_SECRET,ttl:28800});return data.admin===true&&data.version===fingerprint(state.passwordHash);}
export default async function handler(req,res){try{
 if(!prepare(req,res,3000000))return;
 if(!process.env.SESSION_SECRET||!process.env.ADMIN_PASSWORD_HASH)return res.status(503).json({error:'Admin er ikke konfigureret.'});
 if(!['GET','POST'].includes(req.method))return res.status(405).end();
 const {data,etag}=await readState();const body=req.body||{};
 if(req.method==='POST'&&body.action==='logout'){cookie(res,'',0);return res.json({ok:true});}
 if(req.method==='POST'&&body.action==='login'){
  const ip=req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown';
  const path='admin/attempts/'+fingerprint(process.env.SESSION_SECRET+String(ip).split(',')[0])+'.json';
  const previous=await readBlob(path);const now=Date.now();const attempts=previous&&previous.data.until>now?previous.data:{count:0,until:now+15*60*1000};
  if(attempts.count>=8){res.setHeader('Retry-After',Math.ceil((attempts.until-now)/1000));return res.status(429).json({error:'For mange loginforsøg. Prøv igen om 15 minutter.'});}
  await writeBlob(path,{...attempts,count:attempts.count+1},previous?.etag);
  if(body.username!=='admin'||typeof body.password!=='string'||body.password.length>200||!verifyPassword(body.password,data.passwordHash))return res.status(401).json({error:'Forkert brugernavn eller adgangskode.'});
  const token=await sealData({admin:true,version:fingerprint(data.passwordHash)},{password:process.env.SESSION_SECRET,ttl:28800});cookie(res,token,28800);return res.json({ok:true});
 }
 if(!await session(req,data))return res.status(401).json({error:'Log ind for at fortsætte.'});
 if(req.method==='GET')return res.json(publicState(data));
 if(body.revision!==data.revision)return res.status(409).json({error:'En anden ændring er gemt. Genindlæs siden først.'});
 if(body.action==='upload'){try{return res.json(await uploadImage(body));}catch(e){return res.status(400).json({error:e.message});}}
 if(body.action==='save'){
  let settings;try{settings={...validateSettings(body,defaults),images:validateImages(body.images??data.images)};}catch(e){return res.status(400).json({error:e.message});}
  await writeBlob('admin/settings.json',{...data,...settings,revision:data.revision+1},etag);return res.json({ok:true,revision:data.revision+1});
 }
 if(body.action==='password'){
  if(typeof body.current!=='string'||!verifyPassword(body.current,data.passwordHash))return res.status(400).json({error:'Den nuværende adgangskode er forkert.'});
  if(typeof body.password!=='string'||body.password.length<12||body.password.length>200)return res.status(400).json({error:'Brug mindst 12 tegn.'});
  await writeBlob('admin/settings.json',{...data,passwordHash:hashPassword(body.password),revision:data.revision+1},etag);cookie(res,'',0);return res.json({ok:true});
 }res.status(400).json({error:'Ukendt handling.'});
 }catch(e){fail(res,e);}}

