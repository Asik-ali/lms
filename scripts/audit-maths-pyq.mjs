import fs from 'node:fs';import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function checked(q){const {data,error}=await q;if(error)throw new Error(error.message);return data;}
const categories=await checked(db.from('test_categories').select('id,name').eq('series_id',12));
const tests=await checked(db.from('tests').select('id,name,language,status,question_count').in('category_id',categories.map(c=>c.id)).neq('status','Archived'));
const split=fs.existsSync('imports/maths-pyq-parts/receipt.json');
const report={seriesId:12,topics:tests.length,questions:0,unassigned:[],tests:[]};
const embedded=new Set(['Average PYQ','Profit and Loss PYQ','Age Problems PYQ','2D Mensuration PYQ']);
for(const t of tests){
 const rows=await checked(db.from('questions').select('id,correct_answer,explanation').eq('test_id',t.id).order('id'));
 if(t.language!=='English / Tamil'||!['Draft','Published'].includes(t.status)||rows.length!==t.question_count||(split&&rows.length>25))throw new Error(`Invalid test ${t.name}`);
 for(const row of rows){const meta=JSON.parse(row.explanation);if(meta.sourceAnswers||(!embedded.has(t.name.replace(/ - Part \d+$/,''))&&!meta.tamil?.question))throw new Error(`Invalid bilingual metadata ${row.id}`);if(!row.correct_answer)report.unassigned.push({test:t.name,number:meta.number});}
 report.questions+=rows.length;report.tests.push({testId:t.id,name:t.name,questions:rows.length,language:t.language,status:t.status});
}
if(report.topics!==(split?51:13)||report.questions!==1081||report.unassigned.length!==2)throw new Error('Unexpected aggregate totals');
fs.writeFileSync('imports/maths-pyq-remaining/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
