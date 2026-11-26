import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';
const root='imports/maths-pyq-remaining';
if(fs.existsSync('imports/maths-pyq-parts/receipt.json'))throw new Error('Maths PYQ is split into parts. Update active parts instead of the original archived tests.');
const canonical=JSON.parse(fs.readFileSync('imports/maths-pyq/prepared.json','utf8'));
const receipt=JSON.parse(fs.readFileSync('imports/maths-pyq/upload-receipt.json','utf8'));
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function checked(query){const {data,error}=await query;if(error)throw new Error(error.message);return data;}
const bucket='maths-pyq-images', cacheFile=root+'/image-upload-receipt.json';
const cache=fs.existsSync(cacheFile)?JSON.parse(fs.readFileSync(cacheFile,'utf8')):{};
async function upload(file){const bytes=fs.readFileSync(file),hash=crypto.createHash('sha256').update(bytes).digest('hex');const object=file.replace(root+'/images/','remaining/').replace(/\.webp$/,`-${hash.slice(0,12)}.webp`);const url=db.storage.from(bucket).getPublicUrl(object).data.publicUrl;if(cache[file]?.hash!==hash){await checked(db.storage.from(bucket).upload(object,bytes,{contentType:'image/webp',upsert:true}));cache[file]={hash,url};fs.writeFileSync(cacheFile,JSON.stringify(cache,null,2)+'\n');}return url;}
const result={seriesId:receipt.seriesId,tests:[]};
for(const topic of ['Ratio and Proportion','Simple Interest']){
 const paper=canonical.find(p=>p.topic===topic), target=receipt.tests.find(t=>t.topic===topic);
 const test=await checked(db.from('tests').select('id,status,category_id').eq('id',target.testId).single());
 if(test.status!=='Draft'||test.category_id!==target.categoryId)throw new Error('Unexpected target test');
 const before=await checked(db.from('questions').select('id,question,option_a,option_b,option_c,option_d,correct_answer,explanation').eq('test_id',test.id).order('id'));
 if(before.length!==paper.questions.length)throw new Error('Question count mismatch');
 const expected=new Map();
 for(const [i,row] of before.entries()){
  const q=paper.questions[i],meta=JSON.parse(row.explanation);
  if(meta.importBatch!=='maths-pyq-2026-11-24'||meta.number!==q.number||row.correct_answer!==q.correct_answer)throw new Error(`Source/key mismatch ${topic} Q${q.number}`);
  const url=await upload(q.english_image);
  if(!meta.tamil)meta.tamil={question:row.question,...Object.fromEntries(['option_a','option_b','option_c','option_d'].map(k=>[k,row[k]]))};
  meta.sources=q.sources;meta.explanation=`Source question ${q.number}: ${q.sources.join('; ')}`;
  if(q.has_e)meta.extraOptions={option_e:'Option E'};
  delete meta.sourceAnswers;
  const patch={question:url,explanation:JSON.stringify(meta)};
  if(row.question!==patch.question||row.explanation!==patch.explanation)await checked(db.from('questions').update(patch).eq('id',row.id).eq('test_id',test.id));
  expected.set(row.id,{...patch,correct_answer:row.correct_answer});
 }
 await checked(db.from('tests').update({language:'English / Tamil',description:'English and Tamil original PDF questions paired by number. Supplied source answer keys retained; Draft pending publication review.'}).eq('id',test.id).eq('status','Draft'));
 const after=await checked(db.from('questions').select('id,question,correct_answer,explanation').eq('test_id',test.id).order('id'));
 if(after.length!==before.length||after.some((r,i)=>r.id!==before[i].id||Object.entries(expected.get(r.id)).some(([k,v])=>r[k]!==v)))throw new Error('Readback mismatch');
 for(const row of [after[0],after.at(-1)]){const response=await fetch(row.question,{method:'HEAD'});if(!response.ok)throw new Error('Image inaccessible');}
 target.language='English / Tamil';target.issues=paper.issues;
 fs.writeFileSync('imports/maths-pyq/upload-receipt.json',JSON.stringify(receipt,null,2)+'\n');
 result.tests.push({topic,testId:test.id,questions:after.length,questionIdsPreserved:true,answersPreserved:true,language:'English / Tamil',status:'Draft'});
 fs.writeFileSync(root+'/upload-receipt.json',JSON.stringify(result,null,2)+'\n');console.log(`${topic}: updated ${after.length} existing questions; IDs and answers preserved`);
}
console.log(JSON.stringify(result));
