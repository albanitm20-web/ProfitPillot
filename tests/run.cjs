const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=spawn(process.execPath,['preview.cjs'],{cwd:root,env:{...process.env,PORT:'4189'},stdio:['ignore','pipe','inherit']});
const run=file=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[file],{cwd:root,env:{...process.env,PP_TEST_URL:'http://127.0.0.1:4189'},stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(file+' exited '+code)));});
server.on('error',error=>{console.error(error);process.exitCode=1;});
server.stdout.once('data',async()=>{try{await run('tests/ui.cjs');await run('tests/ui-extended.cjs');await run('tests/ui-dashboard.cjs');}catch(error){console.error(error);process.exitCode=1;}finally{server.kill();}});
