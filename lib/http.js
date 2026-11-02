export function prepare(req,res,maxBytes=100000){res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');if(req.method!=='GET'){
 const origin=req.headers.origin;const host=req.headers['x-forwarded-host']||req.headers.host;
 if(!origin||new URL(origin).host!==host){res.status(403).json({error:'Ugyldig afsender.'});return false;}
 if(!String(req.headers['content-type']).startsWith('application/json')){res.status(415).json({error:'JSON kræves.'});return false;}
 if(Number(req.headers['content-length']||0)>maxBytes){res.status(413).json({error:'For mange data.'});return false;}
 }return true;}
export function fail(res,error){console.error("Storage error",error.name,error.message);const conflict=/match|exist|condition/i.test(error.message||'');res.status(conflict?409:503).json({error:conflict?'Indholdet er ændret. Genindlæs siden og prøv igen.':'Kunne ikke hente eller gemme data. Prøv igen om lidt.'});}

