import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const root=process.env.MATHS_IMPORT_ROOT || 'imports/maths-pyq';
const papers=JSON.parse(fs.readFileSync(root+'/papers.json','utf8'));
const sourceDir=String.raw`C:\Users\asik1\Desktop\examsticks pdf\Today`;
const downloadDir=String.raw`C:\Users\asik1\Downloads`;
const scale=2.4;
for(const original of papers){
 if(process.env.MATHS_SOURCE_FILTER && original.source!==process.env.MATHS_SOURCE_FILTER)continue;
 const paper=process.argv.includes('--last-only')?{...original,questions:original.questions.slice(-1)}:process.argv.includes('--multi-only')?{...original,questions:original.questions.filter(q=>q.segments.length>1)}:original;
 if(process.env.MATHS_QUESTION_FILTER)paper.questions=paper.questions.filter(q=>q.number===Number(process.env.MATHS_QUESTION_FILTER));
 if(!paper.questions.length)continue;
 const file=path.join(fs.existsSync(path.join(sourceDir,paper.source))?sourceDir:downloadDir,paper.source);
 const doc=await getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:true,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
 const pieces=new Map();
 for(let pn=1;pn<=doc.numPages;pn++){
  const jobs=paper.questions.flatMap(q=>q.segments.map((segment,index)=>({q,segment,index}))).filter(j=>j.segment.page===pn);
  if(!jobs.length)continue;
  const page=await doc.getPage(pn),viewport=page.getViewport({scale});
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  for(const {q,segment,index} of jobs){
   const [left,top,right,bottom]=segment.rect; const c=createCanvas(Math.ceil((right-left)*scale),Math.ceil((bottom-top)*scale));
   c.getContext('2d').drawImage(canvas,left*scale,top*scale,(right-left)*scale,(bottom-top)*scale,0,0,c.width,c.height);
   if(!pieces.has(q.number))pieces.set(q.number,[]);pieces.get(q.number)[index]=c.toBuffer('image/png');
  }
 }
 for(const q of paper.questions){
  const imgs=await Promise.all(pieces.get(q.number).map(b=>loadImage(b)));
  const canvas=createCanvas(Math.max(...imgs.map(i=>i.width)),imgs.reduce((s,i)=>s+i.height,0));const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);let top=0;
  for(const img of imgs){ctx.drawImage(img,0,top);top+=img.height;}
  fs.mkdirSync(path.dirname(q.source_image),{recursive:true});fs.writeFileSync(q.source_image,canvas.toBuffer('image/webp',92));
 }
 console.log(paper.source+': '+paper.questions.length+' question images');
 await doc.cleanup();
}
