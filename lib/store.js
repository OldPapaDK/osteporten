import {get,put} from '@vercel/blob';
import defaults from './defaults.json' with {type:'json'};
import {closedWeekdays} from './core.js';
export {defaults};
export async function readBlob(path){const r=await get(path,{access:'private',useCache:false});if(!r)return null;if(r.statusCode!==200)throw Error('Lageret kunne ikke læses.');return {data:JSON.parse(await new Response(r.stream).text()),etag:r.blob.etag.replace(/^W\//,'').replace(/^"|"$/g,'')};}
export async function writeBlob(path,data,etag){return put(path,JSON.stringify(data),{access:'private',addRandomSuffix:false,contentType:'application/json',...(etag?{ifMatch:etag}:{allowOverwrite:false})});}
export async function readState(){const found=await readBlob('admin/settings.json');if(found){found.data.texts={...defaults,...found.data.texts};found.data.opened||={tapas:[],sandwich:[]};return found;}return {data:{texts:defaults,blocked:{tapas:[],sandwich:[]},opened:{tapas:[],sandwich:[]},passwordHash:process.env.ADMIN_PASSWORD_HASH,revision:0},etag:null};}
export function publicState(data){return {texts:data.texts,blocked:data.blocked,opened:data.opened,closedWeekdays,revision:data.revision};}
