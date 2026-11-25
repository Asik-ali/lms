import {createWorker} from 'tesseract.js';import fs from 'node:fs';
fs.mkdirSync('tmp/ocr',{recursive:true});
const worker=await createWorker(['eng','tam'],1,{cachePath:'tmp/ocr'});
for(const file of ['imports/maths-pyq/images/paper-13/q001.webp','imports/maths-pyq-additional/images/paper-03/q005.webp','imports/maths-pyq/images/paper-02/q001.webp']){
 const {data}=await worker.recognize(file,{}, {text:true,blocks:true});console.log(JSON.stringify({file,text:data.text,confidence:data.confidence}));
}
await worker.terminate();
