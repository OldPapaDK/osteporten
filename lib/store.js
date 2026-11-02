import {get,put} from '@vercel/blob';
import defaults from './defaults.json' with {type:'json'};
export {defaults};
export async function readBlob(path){const r=await get(path,{access:'private',useCache:false});if(!r)return null;if(r.statusCode!==200)throw Error('Lageret kunne ikke læses.');return {data:JSON.parse(await new Response(r.stream).text()),etag:r.blob.etag.replace(/^W\//,'').replace(/^"|"$/g,'')};}
export async function writeBlob(path,data,etag){return put(path,JSON.stringify(data),{access:'private',addRandomSuffix:false,contentType:'application/json',...(etag?{ifMatch:etag}:{allowOverwrite:false})});}
export async function readState(){const found=await readBlob('admin/settings.json');return found||{data:{texts:defaults,blocked:{tapas:[],sandwich:[]},passwordHash:process.env.ADMIN_PASSWORD_HASH,revision:0},etag:null};}
export function publicState(data){return {texts:data.texts,blocked:data.blocked,revision:data.revision};}
