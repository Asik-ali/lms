import fs from 'node:fs';import path from 'node:path';import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';import {createCanvas} from '@napi-rs/canvas';
const file=String.raw`C:\Users\asik1\Desktop\examsticks pdf\Today\Ratio and Proportion.pdf`;
const d=await getDocument({data:new Uint8Array(fs.readFileSync(file)),useSystemFonts:true,standardFontDataUrl:path.resolve('node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
const p=await d.getPage(1),v=p.getViewport({scale:1.5}),c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;fs.writeFileSync('imports/maths-pyq-remaining/source/ratio-page1.png',c.toBuffer('image/png'));
