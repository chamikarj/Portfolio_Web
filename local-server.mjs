import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import home from './api/index.js';
import message from './api/message.js';
import youtube from './api/youtube.js';
const root=resolve(import.meta.dirname,'public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.json':'application/json'};
const portFlag=process.argv.indexOf('--port');
const port=Number(process.env.PORT||(portFlag>=0?process.argv[portFlag+1]:3000));
http.createServer(async(req,res)=>{
 try {
  const origin=process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`;
  const url=new URL(req.url,origin);
  const handlers={'/':home,'/index.html':home,'/api/index':home,'/api/message':message,'/api/youtube':youtube};
  const handler=handlers[url.pathname];
  if(handler){
   const chunks=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>6000){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
   const body=Buffer.concat(chunks);
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{} )});
   const response=await handler.fetch(request);
   res.writeHead(response.status,Object.fromEntries(response.headers));
   res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const file=resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const info=await stat(file);if(!info.isFile())throw Error('Not found');
  const bytes=await readFile(file);
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1;if(start>end){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));}
  else{res.writeHead(200,{'Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);}
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`Portfolio ready on port ${port}`));
