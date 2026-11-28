import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/backup.mjs';
const result=()=>({setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
async function run(fetcher,task,role='admin'){
 const original=global.fetch,oldUrl=process.env.VITE_SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.VITE_SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
 global.fetch=async(url,init={})=>{const path=String(url);if(path.includes('/auth/v1/user'))return Response.json({id:'admin-id'});if(path.includes('/profiles') && new URL(path).searchParams.get('select')==='role')return Response.json({role});return fetcher(path,init);};
 try{await task();}finally{global.fetch=original;for(const [key,value]of[['VITE_SUPABASE_URL',oldUrl],['SUPABASE_SERVICE_ROLE_KEY',oldKey]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
}
test('history reports the newest successful run independently of the displayed failed runs',async()=>{
 await run(async path=>{
  if(path.includes('status=eq.success'))return Response.json({created_at:'2026-11-20T10:00:00Z'});
  return Response.json([{id:2,type:'manual',status:'failed',created_at:'2026-11-27T10:00:00Z'}]);
 },async()=>{const res=result();await handler({method:'GET',headers:{authorization:'Bearer token'},query:{operation:'history'}},res);assert.equal(res.code,200);assert.equal(res.body.lastSuccessful,'2026-11-20T10:00:00Z');assert.equal(res.body.backups[0].status,'failed');assert.equal(typeof res.body.googleSheetsConfigured,'boolean');});
});
test('history read failure does not create a fake automatic-backup failure',async()=>{
 let writes=0;
 await run(async(path,init)=>{if(init.method==='POST')writes++;return Response.json({message:'History unavailable',code:'XX000'},{status:500});},async()=>{const res=result();await handler({method:'GET',headers:{authorization:'Bearer token'},query:{operation:'history'}},res);assert.equal(res.code,500);assert.equal(writes,0);});
});
test('a completed download export is recorded as a download rather than an email backup',async()=>{
 let saved;
 await run(async(path,init)=>{if(path.includes('/backup_log')&&init.method==='POST'){saved=JSON.parse(init.body);return Response.json({});}return Response.json([]);},async()=>{const res=result();await handler({method:'GET',headers:{authorization:'Bearer token'},query:{operation:'download'}},res);assert.equal(res.code,200);assert.equal(res.body.historyRecorded,true);assert.equal(saved.type,'download');assert.equal(saved.status,'success');assert.deepEqual(saved.emailed_to,[]);});
});


test('cron status verifies the scheduler secret without sending backups or writing history',async()=>{
 const previous=process.env.CRON_SECRET;process.env.CRON_SECRET='test-scheduler-secret';
 try {
  const requests=[];
  await run(async(path,init)=>{requests.push({path,method:init.method||'GET'});return Response.json({created_at:'2026-10-03T00:47:00Z',status:'success'});},async()=>{
   const res=result();await handler({method:'GET',headers:{authorization:'Bearer test-scheduler-secret'},query:{operation:'cron-status'}},res);
   assert.equal(res.code,200);assert.equal(res.body.cronAuthenticated,true);
   assert.equal(requests.length,1);assert.ok(requests[0].path.includes('/backup_log'));assert.equal(requests[0].method,'GET');
  });
 }finally{if(previous===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=previous;}
});
test('cron status rejects a wrong scheduler secret for a non-admin',async()=>{
 const previous=process.env.CRON_SECRET;process.env.CRON_SECRET='test-scheduler-secret';
 try {await run(async()=>{throw new Error('No backup access expected');},async()=>{const res=result();await handler({method:'GET',headers:{authorization:'Bearer incorrect'},query:{operation:'cron-status'}},res);assert.equal(res.code,401);},'student');}
 finally{if(previous===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=previous;}
});
