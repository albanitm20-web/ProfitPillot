const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`);
await db.exec(fs.readFileSync(__dirname+'/supabase.sql','utf8'));console.log('PASS SQL migration executes');
await db.exec(fs.readFileSync(__dirname+'/supabase.sql','utf8'));console.log('PASS SQL migration reruns without deleting data');
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
const doc=require('./core.js').initial();doc.entries=[{id:'test',book:'personal',type:'income',date:'2026-10-01',note:'UJI',category:'Gaji',ref:'',itemId:'',due:'',alias:'',payment:'cash',direction:'payable',deleted:false,amount:100,directCost:0,fee:0,price:0,qty:1}];
async function as(uid){await db.exec(`reset role;set role authenticated;`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);}
await as(a);let r=await db.query('select public.save_profitpilot($1,0) as revision',[doc]);assert.equal(Number(r.rows[0].revision),1);console.log('PASS authenticated save');
await assert.rejects(()=>db.query('select public.save_profitpilot($1,0)',[doc]),e=>e.code==='PT409');console.log('PASS stale revision rejected');
assert.equal((await db.query('select * from public.profitpilot_books')).rows.length,1);
await as(b);assert.equal((await db.query('select * from public.profitpilot_books')).rows.length,0);assert.equal((await db.query('select * from public.profitpilot_books where user_id=$1',[a])).rows.length,0);console.log('PASS account B cannot read account A');
await db.query('select public.save_profitpilot($1,0)',[{...doc,profile:'service'}]);assert.equal((await db.query('select * from public.profitpilot_books')).rows[0].user_id,b);console.log('PASS RPC writes only current account');
await assert.rejects(()=>db.query('update public.profitpilot_books set revision=999 where user_id=$1',[a]),e=>e.code==='42501');console.log('PASS direct writes denied');
await assert.rejects(()=>db.query('select public.save_profitpilot($1,1)',[{...doc,entries:[{...doc.entries[0],amount:-1}]}]),e=>e.code==='PT400');console.log('PASS malformed amount denied');
await as('');await assert.rejects(()=>db.query('select public.save_profitpilot($1,0)',[doc]),e=>e.code==='PT401');console.log('PASS missing authenticated identity denied');
await db.exec('reset role;set role anon');await assert.rejects(()=>db.query('select * from public.profitpilot_books'),e=>e.code==='42501');await assert.rejects(()=>db.query('select public.save_profitpilot($1,0)',[doc]),e=>e.code==='42501');console.log('PASS anonymous reads and writes denied');
await as(a);assert.equal((await db.query('select data from public.profitpilot_books')).rows[0].data.profile,doc.profile);console.log('PASS other account changes leave A intact');await db.close();
})().catch(e=>{console.error(e.message,e.code);process.exitCode=1;});
