import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const root = process.env.MATHS_IMPORT_ROOT || 'imports/maths-pyq';
const additional=!!process.env.MATHS_IMPORT_ROOT;
const expectedTotal=additional?141:940, expectedTopics=additional?3:10;
const batch=additional?'maths-pyq-additional-2026-11-24':'maths-pyq-2026-11-24';
const papers = JSON.parse(fs.readFileSync(`${root}/prepared.json`, 'utf8'));
if (papers.length !== expectedTopics || papers.reduce((n,p)=>n+p.questions.length,0)!==expectedTotal) throw new Error(`Expected ${expectedTotal} questions in ${expectedTopics} topics`);
const expectedCounts={'Compound Interest':85,'AP and GP':48,'Age Problems':8,'Simplification':74,'LCM and HCF':180,'Percentage':111,'Ratio and Proportion':101,'Average':26,'Profit and Loss':52,'Simple Interest':130,'Time and Work':131,'2D Mensuration':38,'3D Mensuration':97};
for(const paper of papers)if(paper.questions.length!==expectedCounts[paper.topic])throw new Error(`Unexpected question count for ${paper.topic}`);
for (const p of papers) for (const [i,q] of p.questions.entries()) {
  if (q.number!==i+1 || (q.correct_answer!==null&&!/^[A-E]$/.test(q.correct_answer))) throw new Error(`Invalid ${p.topic} Q${i+1}`);
  for(const file of [q.english_image,q.tamil_image].filter(Boolean)) if(!fs.existsSync(file)) throw new Error(`Missing image ${file}`);
}
if (process.argv.includes('--check')) { console.log(`Validated ${expectedTotal} questions, ${expectedTopics} topics, all source images present`); process.exit(0); }
if(!process.env.VITE_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase credentials');
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function checked(query){const {data,error}=await query;if(error)throw new Error(error.message);return data;}
async function ensure(table,match,row){let query=db.from(table).select('*');for(const [k,v] of Object.entries(match))query=query.eq(k,v);const saved=await checked(query);if(saved.length>1)throw new Error(`Ambiguous ${table} match`);return saved[0]||checked(db.from(table).insert(row).select('*').single());}
const bucket='maths-pyq-images';
const buckets=await checked(db.storage.listBuckets());
if(!buckets.some(b=>b.id===bucket))await checked(db.storage.createBucket(bucket,{public:true,allowedMimeTypes:['image/webp'],fileSizeLimit:10485760}));
const imageReceiptPath=`${root}/image-upload-receipt.json`;
const cache=fs.existsSync(imageReceiptPath)?JSON.parse(fs.readFileSync(imageReceiptPath,'utf8')):{};
async function uploadImage(file){
 const content=fs.readFileSync(file),hash=crypto.createHash('sha256').update(content).digest('hex');
 const objectPath=file.replace(`${root}/images/`,'').replace(/\.webp$/,`-${hash.slice(0,12)}.webp`);
 const url=db.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
 if(cache[file]?.hash===hash&&cache[file]?.url===url)return url;
 await checked(db.storage.from(bucket).upload(objectPath,content,{contentType:'image/webp',upsert:true}));
 cache[file]={hash,url};fs.writeFileSync(imageReceiptPath,JSON.stringify(cache,null,2)+'\n');return url;
}
async function mapLimit(items,limit,fn){const result=new Array(items.length);let index=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(index<items.length){const i=index++;result[i]=await fn(items[i],i);}}));return result;}
const seriesName='Maths PYQ';
const series=await ensure('test_series',{name:seriesName},{name:seriesName,description:'Topic-wise Maths previous-year questions. English and Tamil sources paired by original number. Original formulas and diagrams preserved. Drafts awaiting source-key review.',is_free:false});
const receipt={seriesId:series.id,seriesName,tests:[]};
for(const [position,paper] of papers.entries()){
 const category=await ensure('test_categories',{series_id:series.id,name:paper.topic},{series_id:series.id,name:paper.topic,position:position+(additional?10:0)});
 const test=await ensure('tests',{category_id:category.id,name:paper.name},{category_id:category.id,name:paper.name,language:paper.language,status:'Draft',duration:Math.max(30,Math.ceil(paper.questions.length*1.2)),total_marks:paper.questions.length,question_count:paper.questions.length,difficulty:'Moderate',syllabus:paper.topic,description:`Original Maths PYQ source questions. ${paper.issues.map(i=>i.issue).join(' ')}`});
 if(test.status!=='Draft')throw new Error(`Refusing to modify non-draft test ${test.id}`);
 const rows=await mapLimit(paper.questions,4,async q=>{
  const question=await uploadImage(q.english_image);
  const translated=q.tamil_image?await uploadImage(q.tamil_image):null;
  const options=Object.fromEntries('abcd'.split('').map(c=>[`option_${c}`,`Option ${c.toUpperCase()}`]));
  const meta={format:'lms-bilingual-v1',number:q.number,importBatch:batch,sources:q.sources,explanation:[`Source question ${q.number}: ${q.sources.join('; ')}`,...q.notes].join('\n'),...(q.has_e?{extraOptions:{option_e:'Option E'}}:{}),...(translated?{tamil:{question:translated,...options}}:{})};
  return {test_id:test.id,question,...options,correct_answer:q.correct_answer,explanation:JSON.stringify(meta),type:'Multiple Choice',category:paper.topic,difficulty:'Medium'};
 });
 const fields=['question','option_a','option_b','option_c','option_d','correct_answer','explanation'];
 const savedBefore=await checked(db.from('questions').select('id,'+fields.join(',')).eq('test_id',test.id).order('id'));
 if(savedBefore.length>rows.length)throw new Error(`Unexpected existing count for ${paper.topic}`);
 for(const [i,q] of savedBefore.entries()){
  let meta;try{meta=JSON.parse(q.explanation);}catch{throw new Error(`Unrecognized existing question ${q.id}`);}
  if(meta.importBatch!==batch||meta.number!==i+1)throw new Error(`Existing question source mismatch ${q.id}`);
  if(fields.some(f=>q[f]!==rows[i][f]))await checked(db.from('questions').update(rows[i]).eq('id',q.id).eq('test_id',test.id));
 }
 for(let offset=savedBefore.length;offset<rows.length;offset+=100)await checked(db.from('questions').insert(rows.slice(offset,offset+100)));
 const saved=await checked(db.from('questions').select('id,'+fields.join(',')).eq('test_id',test.id).order('id'));
 if(saved.length!==rows.length||saved.some((q,i)=>fields.some(f=>q[f]!==rows[i][f])))throw new Error(`Readback mismatch ${paper.topic}`);
 receipt.tests.push({topic:paper.topic,testId:test.id,categoryId:category.id,language:paper.language,status:'Draft',questions:saved.length,answers:saved.filter(q=>q.correct_answer).length,issues:paper.issues});
 fs.writeFileSync(`${root}/upload-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
 console.log(`${paper.topic}: verified ${saved.length} ${paper.language} questions (Draft)`);
}
console.log(JSON.stringify({seriesId:series.id,topics:receipt.tests.length,questions:receipt.tests.reduce((n,t)=>n+t.questions,0),answers:receipt.tests.reduce((n,t)=>n+t.answers,0)}));
