import { test, expect } from '@playwright/test';
async function setup(page, fail = '') {
 const user = {id:'11111111-1111-4111-8111-111111111111',email:'student@example.com',user_metadata:{name:'Alex',role:'student'}};
 await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),user);
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('**/rest/v1/**',r=>{
  const table = new URL(r.request().url()).pathname.split('/').pop();
  if(table === fail) return r.fulfill({status:500,json:{message:'Unavailable'}});
  return r.fulfill({json:table==='profiles'?{...user,name:'Alex',role:'student',course:'Mathematics',status:'Active'}:table==='courses'?[{id:10,title:'Mathematics',duration:'12 weeks'}]:table==='announcements'?[{id:1,title:'Student update',target:'Students',status:'Published'},{id:2,title:'Admin only',target:'Admins',status:'Published'},{id:3,title:'Unpublished',target:'All',status:'Draft'}]:[]});
 });
}
test('dashboard fits mobile widths and profile traps and restores keyboard focus',async({page})=>{
 await setup(page); await page.goto('/student');
 await expect(page.getByRole('link',{name:'Open Mathematics'})).toBeVisible();
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:950});
  const overflow = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right})).slice(0,12)}));
  console.log('Layout',JSON.stringify(overflow));
  expect(overflow.scroll).toBeLessThanOrEqual(width);
 }
 await page.getByRole('button',{name:'Account menu'}).click();
 await page.getByRole('button',{name:'Profile',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Profile',exact:true});
 await expect(dialog).toBeVisible();
 await expect(page.getByRole('button',{name:'Close profile'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');
 await expect(page.getByRole('button',{name:'Update Password'})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(page.getByRole('button',{name:'Close profile'})).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();
 await expect(page.getByRole('button',{name:'Account menu'})).toBeFocused();
});
test('course failure preserves announcements and offers retry',async({page})=>{
 await setup(page,'courses'); await page.goto('/student');
 await expect(page.getByRole('button',{name:'Retry courses'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Student update'})).toBeVisible();
 await expect(page.getByText('Admin only',{exact:true})).toHaveCount(0);
 await page.route('**/rest/v1/courses*',r=>r.fulfill({json:[{id:10,title:'Mathematics'}]}));
 await page.getByRole('button',{name:'Retry courses'}).click();
 await expect(page.getByRole('link',{name:'Open Mathematics'})).toBeVisible();
});
test('announcement failure preserves courses',async({page})=>{
 await setup(page,'announcements');await page.goto('/student');
 await expect(page.getByRole('button',{name:'Retry announcements'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Open Mathematics'})).toBeVisible();
});
for(const [table,path,message,empty] of [['courses','/student/courses','Retry courses','No courses enrolled yet'],['announcements','/student/announcements','Retry announcements','No announcements']]) {
 test(`${table} failures show errors rather than empty states`,async({page})=>{
  await setup(page,table);await page.goto(path);
  await expect(page.getByRole('button',{name:message})).toBeVisible();
  await expect(page.getByText(empty,{exact:true})).toHaveCount(0);
 });
}
test('student announcements excludes admin messages and drafts',async({page})=>{
 await setup(page);await page.goto('/student/announcements');
 await expect(page.getByRole('heading',{name:'Student update'})).toBeVisible();
 await expect(page.getByText('Admin only',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Unpublished',{exact:true})).toHaveCount(0);
});
test('legacy URL password is removed without autofill or automatic login',async({page})=>{
 let loginRequests=0;
 await page.route('**/auth/v1/**',r=>{if(r.request().method()==='POST')loginRequests++;return r.fulfill({json:{user:null}});});
 await page.goto('/login?username=alex&password=legacy-secret');
 await expect(page.getByRole('button',{name:'Sign In',exact:true})).toBeVisible();
 await expect(page).not.toHaveURL(/password=/);
 await expect(page.getByLabel('Password',{exact:true})).toHaveValue('');
 expect(loginRequests).toBe(0);
});

test('admin quick login signs in directly without putting credentials in navigation URLs',async({page})=>{
 const admin={id:'11111111-1111-4111-8111-111111111111',email:'admin@example.com',user_metadata:{name:'Admin',role:'admin'}};
 const student={id:'22222222-2222-4222-8222-222222222222',email:'alex@example.com',user_metadata:{name:'Alex',role:'student'}};
 let activeUser=admin;
 const visited=[];
 page.on('request',request=>visited.push(request.url()));
 await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'admin-token',refresh_token:'refresh',expires_at:Math.floor(Date.now()/1000)+3600,user})),admin);
 await page.route('**/auth/v1/**',r=>{
  if(new URL(r.request().url()).pathname.endsWith('/token')) {
   expect(r.request().postDataJSON()).toMatchObject({email:student.email,password:'temporary-secret'});
   activeUser=student;
   return r.fulfill({json:{access_token:'student-token',refresh_token:'refresh',token_type:'bearer',expires_in:3600,user:student}});
  }
  return r.fulfill({json:activeUser});
 });
 await page.route('**/rest/v1/**',r=>{
  const url=new URL(r.request().url()), table=url.pathname.split('/').pop();
  return r.fulfill({json:table==='profiles'?(url.searchParams.has('id')?{...activeUser,name:activeUser.user_metadata.name,role:activeUser.user_metadata.role,course:'Mathematics',status:'Active'}:[]):table==='courses'?[{id:10,title:'Mathematics'}]:[]});
 });
 await page.route('**/api/create-student',r=>r.fulfill({json:{email:student.email,password:'temporary-secret'}}));
 await page.goto('/admin/students/add');
 await page.getByPlaceholder('Enter full name').fill('Alex');
 await page.getByPlaceholder('Enter email address').fill(student.email);
 await page.getByRole('button',{name:'Enroll Student',exact:true}).click();
 await page.getByRole('button',{name:'Quick Login as Alex',exact:true}).click();
 await expect(page).toHaveURL(/\/student$/);
 await expect(page.getByRole('heading',{name:'Welcome back, Alex'})).toBeVisible();
 expect(visited.some(url=>url.includes('temporary-secret')||url.includes('password='))).toBe(false);
});
