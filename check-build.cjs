const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const build=env=>spawnSync(process.execPath,['build.cjs'],{cwd:__dirname,encoding:'utf8',env:{...process.env,SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',...env}});
assert.notEqual(build({SUPABASE_URL:'https://fictional.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_ship'}).status,0);
assert.notEqual(build({SUPABASE_URL:'https://untrusted.example',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fake'}).status,0);
const result=build({SUPABASE_URL:'https://fictional.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fake'});assert.equal(result.status,0,result.stderr);let html=fs.readFileSync(__dirname+'/dist/index.html','utf8');assert.ok(html.includes("connect-src 'self' https://fictional.supabase.co"));assert.ok(html.includes('"key":"sb_publishable_fake"'));
assert.equal(build({}).status,0);html=fs.readFileSync(__dirname+'/dist/index.html','utf8');assert.ok(!html.includes('fictional.supabase.co'));for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log('PASS build rejects secret keys and wrong origins; configured and local scripts compile.');
