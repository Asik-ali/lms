import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const dir = String.raw`C:\Users\asik1\Desktop\examsticks pdf\Today`;
const root=process.env.MATHS_IMPORT_ROOT || 'imports/maths-pyq';
fs.mkdirSync(root+'/source', {recursive:true});
let inputs = fs.readdirSync(dir).filter(f=>f.endsWith('.pdf')).map(file=>({file,folder:dir}));
const downloads=String.raw`C:\Users\asik1\Downloads`;
for(const file of fs.readdirSync(downloads).filter(f=>f.startsWith('SI ') && f.endsWith('pyq.pdf'))) inputs.push({file,folder:downloads});
if(process.argv.includes('--additional'))inputs=fs.readdirSync(downloads).filter(file=>/^(?:CI |AP GP|Age problem)/.test(file)&&file.endsWith('.pdf')).map(file=>({file,folder:downloads}));
for (const {file,folder} of inputs) {
 const doc=await getDocument({data:new Uint8Array(fs.readFileSync(path.join(folder,file))),useSystemFonts:true}).promise;
 const pages=[];
 for(let i=1;i<=doc.numPages;i++) {const p=await doc.getPage(i), c=await p.getTextContent();const v=p.getViewport({scale:1}); const items=c.items.filter(x=>x.str?.trim()).map(x=>({text:x.str,x:x.transform[4],y:v.height-x.transform[5],w:x.width,h:x.height})); const rows=[];for(const item of items.toSorted((a,b)=>a.y-b.y||a.x-b.x)){let row=rows.find(r=>Math.abs(r.y-item.y)<3);if(!row){row={y:item.y,items:[]};rows.push(row);}row.items.push(item);} const text=rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ')).join('\n'); pages.push({page:i,width:v.width,height:v.height,items,text}); }
 fs.writeFileSync(root+'/source/'+file+'.json',JSON.stringify(pages));
 fs.writeFileSync(root+'/source/'+file+'.txt',pages.map(p=>`--- PAGE ${p.page} ---\n${p.text}`).join('\n'));
 console.log(JSON.stringify({file,pages:pages.length,chars:pages.reduce((s,p)=>s+p.text.length,0),sample:pages[0].text.slice(0,250),end:pages.at(-1).text.slice(-500)}));
 await doc.cleanup();
}
