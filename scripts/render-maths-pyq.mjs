import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createCanvas} from '@napi-rs/canvas';
const dir=String.raw`C:\Users\asik1\Desktop\examsticks pdf\Today`;
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.pdf'));
for(const [i,file] of files.entries()){
 if(!file.startsWith('2D')&&!file.startsWith('Profit')&&!file.startsWith('Average')&&!file.startsWith('LCM')&&!file.startsWith('3D')&&!file.startsWith('Ratio'))continue;
 const doc=await getDocument({data:new Uint8Array(fs.readFileSync(path.join(dir,file))),useSystemFonts:true,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
 for(const pn of [1,doc.numPages]) {
 const page=await doc.getPage(pn), v=page.getViewport({scale:1.3}), c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));
 await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
 fs.writeFileSync(`imports/maths-pyq/source/paper-${i+1}-page-${pn}.png`,c.toBuffer('image/png'));console.log(i+1,file,pn);
 }
}
