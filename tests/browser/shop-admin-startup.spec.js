import { test, expect } from '@playwright/test';
async function setup(page,role='student') {
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',user_metadata:{name:'Alex',role}};
 await page.addInitScript(({user})=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),{user});
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('**/rest/v1/**',r=>{
  const url=new URL(r.request().url()),table=url.pathname.split('/').pop();
  const courses=[{id:10,title:'Maths',status:'Draft',duration:'12 weeks'}];
  const data=table==='profiles'?(url.searchParams.has('id')?{...user,name:'Alex',role,course:'Maths',test_series_access:'',status:'Active'}:[]):table==='sales_plans'?[{id:1,name:'Bundle',status:'active',price:100}]:table==='sales_plan_items'?[{id:1,plan_id:1,item_type:'course',item_id:10},{id:2,plan_id:1,item_type:'test_series',item_id:20}]:table==='courses'?courses:table==='test_series'?[{id:20,name:'Series One'}]:table==='test_categories'?[{id:30,name:'Section One',series_id:20,parent_id:null}]:table==='tests'?[{id:40,name:'Draft Test',status:'Draft',duration:30,total_marks:10}]:[];
  return r.fulfill({json:data});
 });
 await page.route('**/api/order-status*',r=>r.fulfill({json:{orders:[],purchases:[],availableCredit:0}}));
 await page.route('**/api/backup*',r=>r.fulfill({json:{backups:[]}}));
}
for(const theme of ['light','dark'])test(`bundle notice and cards remain readable in ${theme} mode`,async({page})=>{
 await setup(page);await page.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
 await page.route('**/api/sales-plans*',r=>r.fulfill({json:[{id:1,name:'Bundle',status:'active',price:100,items:[{plan_id:1,item_type:'course',item_id:10},{plan_id:1,item_type:'test_series',item_id:20}]}]}));
 await page.goto('/student/buy-courses');
 await expect(page.locator('header.workspace-topbar')).toContainText('Shop Courses & Tests');
 const notice=page.getByText('You already own some of this bundle.',{exact:false});await expect(notice).toBeVisible();
 await expect(notice).toHaveCSS('color',theme==='light'?'rgb(133, 77, 14)':'rgb(253, 230, 138)');
 await page.screenshot({path:`tmp/shop-updated-${theme}.png`,fullPage:true});
});
for(const role of ['student','admin'])test(`${role} empty tickets have no selection prompt`,async({page})=>{
 await setup(page,role);await page.goto(role==='admin'?'/admin/tickets':'/student/messages');
 await expect(page.getByText(/No tickets/)).toBeVisible();
 await expect(page.getByText(/Select a ticket/)).toHaveCount(0);
});
test('admin can publish a draft course directly',async({page})=>{
 await setup(page,'admin');let published;
 await page.route('**/rest/v1/courses*',r=>{
  if(r.request().method()==='PATCH'){published=r.request().postDataJSON();return r.fulfill({json:{id:10,title:'Maths',status:'Published'}});}
  return r.fulfill({json:new URL(r.request().url()).searchParams.has('id')?{id:10,title:'Maths'}:[{id:10,title:'Maths',status:'Draft'}]});
 });
 await page.goto('/admin/courses');await page.getByRole('button',{name:'Publish Maths',exact:true}).click();
 await expect.poll(()=>published).toEqual({status:'Published'});await expect(page.getByRole('cell',{name:'Published',exact:true})).toBeVisible();
});
test('admin can publish a draft test directly',async({page})=>{
 await setup(page,'admin');let published;
 await page.route('**/rest/v1/tests*',r=>{if(r.request().method()==='PATCH'){published=r.request().postDataJSON();return r.fulfill({json:{id:40,status:'Published'}});}return r.fulfill({json:[{id:40,name:'Draft Test',status:'Draft',duration:30,total_marks:10}]});});
 await page.goto('/admin/exams/questions');await page.getByRole('button',{name:'Series One',exact:true}).click();await page.getByText('Section One',{exact:true}).click();await page.getByRole('button',{name:'Publish Draft Test',exact:true}).click();
 await expect.poll(()=>published).toEqual({status:'Published'});await expect(page.getByText('Published',{exact:true})).toBeVisible();
});
test('backup preview validates records and sends original IDs to transactional restore',async({page})=>{
 await setup(page,'admin');let restored;
 await page.route('**/api/backup*',r=>{if(new URL(r.request().url()).searchParams.get('operation')==='restore'){restored=r.request().postDataJSON();return r.fulfill({json:{success:true}});}return r.fulfill({json:{backups:[]}});});
 await page.goto('/admin/settings/backup');const paste=page.getByPlaceholder('{"version":1,"createdAt":"...","tables":{...}}');
 await paste.fill(JSON.stringify({version:1,tables:{courses:{__error:'failed'}}}));await expect(page.getByRole('button',{name:'Restore Pasted Backup'})).toBeDisabled();
 const backup={version:1,type:'lms-backup',tables:{courses:[{id:99,title:'Recovered',status:'Draft'}]}};
 await paste.fill(JSON.stringify(backup));await expect(page.getByText('Backup Preview',{exact:false})).toBeVisible();
 page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Restore Pasted Backup'}).click();
 await expect.poll(()=>restored).toEqual({backup});
});
for(const theme of ['light','dark'])test(`startup animation appears before app JavaScript in ${theme} mode`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
 await page.route('**/assets/index-*.js',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/login');await expect(page.locator('.boot-book')).toBeVisible();
 await expect(page.getByText('Preparing your learning workspace...')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.boot-book')).toHaveCSS('animation-name','none');
 await page.screenshot({path:`tmp/startup-${theme}.png`});
});
