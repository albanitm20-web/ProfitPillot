const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const port=Number(process.env.PORT||4173);
http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=['/','/test-no-js'].includes(pathname)?'index.html':pathname.slice(1);const allowed=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png'];if(!allowed.includes(file)){res.writeHead(404);return res.end('Not found');}const type=file.endsWith('.png')?'image/png':file.endsWith('.js')?'text/javascript':file.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8';let body=fs.readFileSync(path.join(__dirname,'dist',file));if(pathname==='/test-no-js')body=body.toString().replace("script-src 'self' 'unsafe-inline'","script-src 'none'");res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
