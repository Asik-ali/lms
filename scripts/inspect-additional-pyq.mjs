import fs from 'node:fs';import path from 'node:path';import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';import {createCanvas} from '@napi-rs/canvas';
const file=String.raw`C:\Users\asik1\Downloads\Age problem Bilingual pyq.pdf`;
const doc=await getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:true,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
for(let pn=1;pn<=doc.numPages;pn++){const page=await doc.getPage(pn),viewport=page.getViewport({scale:1.6}),c=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:c.getContext('2d'),viewport}).promise;fs.writeFileSync(`imports/maths-pyq-additional/source/age-${pn}.png`,c.toBuffer('image/png'));}
