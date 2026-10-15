import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const file=resolve(import.meta.dirname,'../dist/index.html');
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4173);
createServer((req,res)=>{if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?'':readFileSync(file));}).listen(port,host,()=>console.log(`AFTERFIRE: http://${host}:${port}`));
