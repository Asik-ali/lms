import { test, expect } from '@playwright/test';
async function setup(page, role, handler) {
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',user_metadata:{name:'Alex',role}};
 await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),user);
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('**/rest/v1/**',r=>{
 const url=new URL(r.request().url()); const table=url.pathname.split('/').pop();
 if(table==='profiles') return r.fulfill({json:url.searchParams.has('id')?{...user,name:'Alex',role}:[]});
 return handler(r,table,url);
 });
}
for(const role of ['student','admin']) {
 test(`${role}: switching tickets cancels stale replies and failed replies can retry`,async({page})=>{
 let firstStarted=false; let release; const delayed=new Promise(resolve=>release=resolve); let failSecond=true;
 await setup(page,role,async(r,table,url)=>{
 if(table==='tickets') return r.fulfill({json:[1,2].map(id=>({id,subject:`Ticket ${id}`,message:`Question ${id}`,status:'In Progress',created_at:'2026-11-28T00:00:00Z'}))});
 if(table==='ticket_replies') {
 const first=url.searchParams.get('ticket_id')==='eq.1';
 if(first){firstStarted=true;await delayed;return r.fulfill({json:[{id:1,message:'Stale first reply'}]}).catch(()=>{});}
 return r.fulfill(failSecond?{status:500,json:{message:'Unavailable'}}:{json:[{id:2,message:'Correct second reply'}]});
 }
 return r.fulfill({json:[]});
 });
 await page.goto(role==='student'?'/student/messages':'/admin/tickets');
 await page.getByRole('button',{name:/Ticket 1/}).click();
 await expect.poll(()=>firstStarted).toBe(true);
 await page.getByRole('button',{name:/Ticket 2/}).click();
 await expect(page.getByRole('button',{name:'Retry replies'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Send Reply'})).toBeDisabled();
 release(); failSecond=false;
 await page.getByRole('button',{name:'Retry replies'}).click();
 await expect(page.getByText('Correct second reply')).toBeVisible();
 await expect(page.getByText('Stale first reply')).toHaveCount(0);
 });
}
test('ticket list failure shows retry instead of a false empty state',async({page})=>{
 let fail=true;
 await setup(page,'student',(r,table)=>r.fulfill(table==='tickets'&&fail?{status:500,json:{message:'Unavailable'}}:{json:[]}));
 await page.goto('/student/messages');
 await expect(page.getByRole('button',{name:'Retry tickets'})).toBeVisible();
 await expect(page.getByText('No tickets yet')).toHaveCount(0);
 fail=false;await page.getByRole('button',{name:'Retry tickets'}).click();
 await expect(page.getByText('No tickets yet')).toBeVisible();
});
test('course resources fail independently and recover with retry',async({page})=>{
 let fail=true;
 await setup(page,'student',(r,table)=>r.fulfill(table==='course_lessons'&&fail?{status:500,json:{message:'Unavailable'}}:{json:table==='courses'?{id:1,title:'Mathematics',status:'Published'}:table==='course_pdf_metadata'?[{id:2,title:'Working PDF',day:1}]:[]}));
 await page.goto('/student/courses/1');
 await expect(page.getByRole('heading',{name:'Mathematics',exact:true})).toBeVisible();
 await expect(page.getByText('Videos could not be loaded.')).toBeVisible();
 await page.getByRole('button',{name:/^Day 1/}).click();
 await expect(page.getByText('1. Working PDF',{exact:true})).toBeVisible();
 fail=false;await page.getByRole('button',{name:'Retry resources'}).click();
 await expect(page.getByRole('button',{name:'Retry resources'})).toHaveCount(0);
});
test('course request failure can retry without claiming the course is missing',async({page})=>{
 let fail=true;
 await setup(page,'student',(r,table)=>r.fulfill(table==='courses'&&fail?{status:500,json:{message:'Unavailable'}}:{json:table==='courses'?{id:1,title:'Recovered course'}:[]}));
 await page.goto('/student/courses/1');
 await expect(page.getByRole('button',{name:'Retry course'})).toBeVisible();
 await expect(page.getByText('Course not found.')).toHaveCount(0);
 fail=false;await page.getByRole('button',{name:'Retry course'}).click();
 await expect(page.getByRole('heading',{name:'Recovered course'})).toBeVisible();
});
test('a broken screen keeps navigation available and can recover',async({page})=>{
 let broken=true;
 await setup(page,'student',(r,table)=>r.fulfill({json:table==='courses'?{id:1,title:broken?{invalid:true}:'Recovered screen'}:[]}));
 await page.goto('/student/courses/1');
 await expect(page.getByRole('heading',{name:'Unable to open this screen'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Messages',exact:true})).toBeVisible();
 broken=false; await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Recovered screen'})).toBeVisible();
});
test('validation errors remain readable and can be dismissed',async({page})=>{
 await setup(page,'student',r=>r.fulfill({json:[]}));
 await page.goto('/student/messages');
 await page.getByRole('button',{name:'New Ticket',exact:true}).click();
 await page.getByRole('button',{name:'Submit Ticket',exact:true}).click();
 await expect(page.getByText('Fill in all fields')).toBeVisible();
 await page.getByRole('button',{name:'Dismiss notification'}).click();
 await expect(page.getByText('Fill in all fields')).toHaveCount(0);
});

