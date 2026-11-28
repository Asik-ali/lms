import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=await readFile(new URL('../scripts/google-sheets-backup.gs',import.meta.url),'utf8');
function receiver({missing=false,initial=[],props={}}={}) {
 const rows=structuredClone(initial);let opened=0,locked=false;
 const properties={BACKUP_SECRET:'test-secret',BACKUP_SPREADSHEET_ID:'existing-sheet',...props};
 const sheet={getLastRow:()=>rows.length,appendRow(row){rows.push([...row]);},getRange(row,col,height,width){return {
  getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row-1+i]?.[col-1+j]??'')),
  setValues(values){for(let i=0;i<values.length;i++)rows[row-1+i]=[...values[i]];},
  createTextFinder(value){return{matchEntireCell(){return this;},findAll(){return rows.map((entry,index)=>({entry,index})).filter(({entry,index})=>index>=row-1&&index<row-1+height&&entry[col-1]===value).map(({index})=>({getRow:()=>index+1}));}};}
 }}};
 const context=vm.createContext({
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null})},
  LockService:{getScriptLock:()=>({waitLock(){locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}})},
  SpreadsheetApp:{openById(id){assert.equal(id,'existing-sheet');opened++;return {getSheetByName(name){assert.equal(name,props.BACKUP_SHEET_NAME||'Backup Archive');return missing?null:sheet;},insertSheet(){throw new Error('Must never create a tab');},deleteSheet(){throw new Error('Must never delete a tab');}};}},
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_algorithm,value)=>[...createHash('sha256').update(value).digest()].map(n=>n>127?n-256:n)},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({setMimeType:()=>value})},
 });
 vm.runInContext(source,context);
 return {rows,get opened(){return opened;},post(backup,secret='test-secret'){return JSON.parse(context.doPost({postData:{contents:JSON.stringify({secret,backup})}}));}};
}
const backup=(overrides={})=>({version:1,type:'lms-backup',createdAt:'2026-11-28T00:00:00Z',tables:{courses:[{id:1,title:'Maths'}],backup_log:[]},...overrides});

test('unchanged backups and retries do not append duplicate rows, even with a new capture time or history',()=>{
 const r=receiver();const first=r.post(backup());assert.equal(first.success,true);assert.equal(first.duplicate,false);const count=r.rows.length;
 const second=r.post(backup({createdAt:'2026-11-29T00:00:00Z',tables:{backup_log:[{id:99}],courses:[{title:'Maths',id:1}]}}));
 assert.equal(second.success,true);assert.equal(second.duplicate,true);assert.equal(second.backupId,first.backupId);assert.equal(r.rows.length,count);
});
test('updated source records create exactly one new backup and preserve all existing rows',()=>{
 const r=receiver();r.post(backup());const original=structuredClone(r.rows);
 const changed=backup({tables:{courses:[{id:1,title:'Updated Maths'}],backup_log:[]}});
 const response=r.post(changed);assert.equal(response.duplicate,false);assert.deepEqual(r.rows.slice(0,original.length),original);
 const length=r.rows.length;r.post(changed);assert.equal(r.rows.length,length);
});
test('the latest legacy random-ID backup is recognized without rewriting it',()=>{
 const original=backup();const initial=[['Backup ID','Created At','Part','Parts','JSON Chunk'],['old-random-id',original.createdAt,1,1,JSON.stringify(original)]];
 const r=receiver({initial});const response=r.post(backup({createdAt:'2026-11-29T00:00:00Z'}));assert.equal(response.duplicate,true);assert.equal(response.backupId,'old-random-id');assert.deepEqual(r.rows,initial);
});
test('missing tabs and incorrect layouts are rejected without creating or changing sheets',()=>{
 const missing=receiver({missing:true});assert.equal(missing.post(backup()).success,false);assert.equal(missing.rows.length,0);
 const initial=[['Existing data','Must stay']];const mismatch=receiver({initial});assert.equal(mismatch.post(backup()).success,false);assert.deepEqual(mismatch.rows,initial);
});
test('bad authentication and incomplete exports never touch the spreadsheet',()=>{
 const r=receiver();assert.equal(r.post(backup(),'incorrect').success,false);assert.equal(r.post(backup({tables:{courses:{__error:'failed'}}})).success,false);assert.equal(r.opened,0);
});
test('multi-part backups preserve Unicode and repeated content is not duplicated',()=>{
 const r=receiver();const large=backup({tables:{courses:[{id:1,title:'தமிழ்📖'.repeat(18000)}]}});const first=r.post(large);assert.ok(first.parts>1);
 const decoded=JSON.parse(r.rows.slice(1).map(row=>row[4]).join(''));assert.deepEqual(decoded,large);
 const count=r.rows.length;assert.equal(r.post(large).duplicate,true);assert.equal(r.rows.length,count);
});
test('an incomplete existing backup fails without overwriting or appending rows',()=>{
 const r=receiver();r.post(backup());r.rows[1][4]='broken';const initial=structuredClone(r.rows);assert.equal(r.post(backup()).success,false);assert.deepEqual(r.rows,initial);
});
