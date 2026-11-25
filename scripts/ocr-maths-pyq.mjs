import fs from 'node:fs';import crypto from 'node:crypto';import {createWorker} from 'tesseract.js';
const roots=['imports/maths-pyq','imports/maths-pyq-additional'];
const files=[...new Set(roots.flatMap(root=>JSON.parse(fs.readFileSync(root+'/prepared.json','utf8')).flatMap(p=>p.questions.flatMap(q=>[q.english_image,q.tamil_image].filter(Boolean)))))];
fs.mkdirSync('imports/maths-pyq-text/ocr',{recursive:true});fs.mkdirSync('tmp/ocr',{recursive:true});
let next=0,done=0;
await Promise.all(Array.from({length:3},async()=>{
 const worker=await createWorker(['eng','tam'],1,{cachePath:'tmp/ocr'});
 while(next<files.length){const file=files[next++],bytes=fs.readFileSync(file),hash=crypto.createHash('sha256').update(bytes).digest('hex');const target=`imports/maths-pyq-text/ocr/${hash}.json`;
  if(!fs.existsSync(target)){const {data}=await worker.recognize(bytes,{}, {text:true,blocks:true});const words=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[]))).map(w=>({text:w.text,confidence:w.confidence,bbox:w.bbox}));fs.writeFileSync(target,JSON.stringify({file,hash,text:data.text,confidence:data.confidence,words}));}
  done++;if(done%100===0)console.log(`OCR ${done}/${files.length}`);
 }
 await worker.terminate();
}));
console.log(`OCR complete: ${files.length} source images`);
