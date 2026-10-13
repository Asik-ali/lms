import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const report = JSON.parse(fs.readFileSync('imports/maths/image-optimization.json','utf8'));
const receipt = JSON.parse(fs.readFileSync('imports/maths/upload-receipt.json','utf8'));
if (report.count !== 610 || report.images.length !== 610 || !report.pixelIdentical) throw new Error('Invalid optimization report');
const db = createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket = db.storage.from('maths-question-images');
const checked = async request => { const {data,error} = await request; if(error) throw new Error(error.message); return data; };
const referenced = new Set();
for (const test of receipt.tests) {
  const rows = await checked(db.from('questions').select('question').eq('test_id',test.testId));
  for(const row of rows) referenced.add(row.question);
}
for(const item of report.images) {
  const url = bucket.getPublicUrl(item.objectPath).data.publicUrl;
  if(!referenced.has(url) || !item.objectPath.startsWith('final/paper-') || item.after > item.before) throw new Error(`Unexpected image: ${item.objectPath}`);
}
let completed = 0;
for (let offset=0;offset<report.images.length;offset+=4) {
  await Promise.all(report.images.slice(offset,offset+4).map(async item => {
    const bytes = fs.readFileSync(item.optimized);
    if(createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error('Local checksum mismatch');
    await checked(bucket.upload(item.objectPath,bytes,{contentType:'image/png',upsert:true,cacheControl:'3600'}));
    const blob = await checked(bucket.download(item.objectPath));
    if(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex') !== item.sha256) throw new Error(`Remote checksum mismatch: ${item.objectPath}`);
    completed++;
  }));
  if(completed%40===0 || completed===610) console.log(`Replaced and verified ${completed}/610 images`);
}
fs.writeFileSync('imports/maths/image-optimization-receipt.json',JSON.stringify({completed,beforeBytes:report.beforeBytes,afterBytes:report.afterBytes,savedPercent:report.savedPercent,pixelIdentical:true},null,2)+'\n');
console.log(`Saved ${report.savedPercent}% with identical pixels and unchanged URLs`);
