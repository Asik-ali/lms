import fs from 'node:fs';import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';import {createCanvas} from '@napi-rs/canvas';
const doc=await getDocument({data:new Uint8Array(fs.readFileSync('C:/Users/asik1/Desktop/examsticks pdf/Today/Average Bilingual pyq.pdf')),useSystemFonts:true}).promise;
fs.mkdirSync('tmp/pdf-review',{recursive:true});
for(const n of [4,5]){const p=await doc.getPage(n),v=p.getViewport({scale:1.5}),c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;fs.writeFileSync(`tmp/pdf-review/average-${n}.png`,c.toBuffer('image/png'));}
