import {readState,publicState} from '../lib/store.js';
import {available} from '../lib/core.js';
import {prepare,fail} from '../lib/http.js';
export default async function handler(req,res){try{if(!prepare(req,res))return;const {data}=await readState();if(req.method==='GET')return res.json(publicState(data));if(req.method==='POST'){const {kind,date}=req.body||{};if(!available(data,kind,date))return res.status(409).json({error:'Denne dato kan ikke bestilles. Vælg en anden dag.'});return res.json({ok:true,demo:true});}res.status(405).end();}catch(e){fail(res,e);}}
