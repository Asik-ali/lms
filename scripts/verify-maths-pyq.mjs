import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const root=process.env.MATHS_IMPORT_ROOT||'imports/maths-pyq';
const additional=!!process.env.MATHS_IMPORT_ROOT;
const expectedTotal=additional?141:940, expectedTopics=additional?3:10;
const receipt=JSON.parse(fs.readFileSync(root+'/upload-receipt.json','utf8'));
if(receipt.tests.length!==expectedTopics)throw new Error('Upload incomplete');
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ids=receipt.tests.map(t=>t.testId);
const {data:questions,error}=await db.from('questions').select('id,test_id,question,correct_answer,explanation').in('test_id',ids).order('id');
if(error)throw error;
if(questions.length!==expectedTotal)throw new Error(`Expected ${expectedTotal} saved questions, got ${questions.length}`);
for(const test of receipt.tests){
 const rows=questions.filter(q=>q.test_id===test.testId);
 if(rows.length!==test.questions)throw new Error(`Wrong count for ${test.topic}`);
 const numbers=new Set();
 for(const q of rows){const meta=JSON.parse(q.explanation);if(meta.sourceAnswers||meta.correct_answer)throw new Error(`Answer key exposed in metadata ${q.id}`);numbers.add(meta.number);}
 if(numbers.size!==rows.length||[...numbers].some(n=>n<1||n>rows.length))throw new Error(`Wrong numbering for ${test.topic}`);
 const response=await fetch(rows[0].question,{method:'HEAD',signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.includes('image/'))throw new Error(`Public image unavailable for ${test.topic}`);
}
const {data:tests,error:testError}=await db.from('tests').select('id,status,language,question_count').in('id',ids);
if(testError)throw testError;
if(tests.some(t=>t.status!=='Draft'))throw new Error('Unexpected non-draft test');
const result={seriesId:receipt.seriesId,topics:tests.length,questions:questions.length,answers:questions.filter(q=>q.correct_answer).length,unassigned:questions.filter(q=>!q.correct_answer).length,publicImageChecks:receipt.tests.length,status:'Draft',studentMetadataContainsAnswerKeys:false};
fs.writeFileSync(root+'/verification.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
