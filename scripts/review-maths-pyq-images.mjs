import fs from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const papers=JSON.parse(fs.readFileSync('imports/maths-pyq/papers.json','utf8'));
const canvas=createCanvas(1600, papers.length*210),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
for(const [i,p] of papers.entries()){
 ctx.fillStyle='black';ctx.font='18px sans-serif';ctx.fillText(`${i+1}. ${p.topic} (${p.language})`,10,i*210+23);
 for(const [j,q] of [p.questions[0],p.questions[Math.floor(p.questions.length/2)],p.questions.at(-1)].entries()){
  const img=await loadImage(q.source_image);const scale=Math.min(510/img.width,170/img.height);ctx.drawImage(img,j*530+5,i*210+35,img.width*scale,img.height*scale);
 }
}
fs.writeFileSync('imports/maths-pyq/source/crop-review.png',canvas.toBuffer('image/png'));
