import { test, expect } from '@playwright/test';
for (const viewport of [{width:320,height:640},{width:390,height:844},{width:640,height:360}]) {
 test(`mobile test start, timer and submit fit ${viewport.width}x${viewport.height}`, async({page})=>{
  await page.setViewportSize(viewport);
  const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',user_metadata:{name:'Alex',role:'student'}};
  const exam={id:1,name:'Comprehensive Mathematics Practice Examination for Competitive Exams',duration:90,total_marks:4,status:'Published',language:'English and Tamil',difficulty:'Moderate'};
  const attempt={id:9,test_id:1,student_id:user.id,status:'in_progress',started_at:new Date().toISOString()};
  const question={id:1,question:'What is two plus two?',option_a:'Four',option_b:'Three',option_c:'Two',option_d:'One',correct_answer:'A',explanation:JSON.stringify({format:'lms-bilingual-v1',tamil:{question:'இரண்டு கூட்டல் இரண்டு என்ன?',option_a:'நான்கு',option_b:'மூன்று',option_c:'இரண்டு',option_d:'ஒன்று'}})};
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),user);
  await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
  let submitted=false;
  await page.route('**/rest/v1/**',r=>{
   const url=new URL(r.request().url()),table=url.pathname.split('/').pop();
   if(r.request().method()==='HEAD')return r.fulfill({headers:{'content-range':'0-0/1'}});
   if(table==='test_attempts' && r.request().method()==='PATCH') {submitted=true;return r.fulfill({json:{...attempt,...r.request().postDataJSON()}});}
   return r.fulfill({json:table==='profiles'?{...user,name:'Alex',role:'student',status:'Active'}:table==='tests'?exam:table==='questions'?[question]:table==='test_attempts'?(url.searchParams.has('id')||url.searchParams.get('status')==='eq.in_progress'?attempt:[]):table==='test_responses'&&r.request().method()==='POST'?{id:1,...r.request().postDataJSON()}:[]});
  });
  const noOverflow=async()=>{
   const dimensions=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,content:document.querySelector('.dashboard-content')?.clientWidth,scroll:document.querySelector('.dashboard-content')?.scrollWidth}));
   expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
   expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.content);
  };
  await page.goto('/student/test/1');
  const start=page.getByRole('button',{name:'Start Test',exact:true});
  await start.scrollIntoViewIfNeeded();await expect(start).toBeInViewport();await noOverflow();
  await start.click();
  await expect(page.getByText('What is two plus two?',{exact:true})).toBeVisible();
  await noOverflow();
  await expect(page.getByLabel('Time remaining',{exact:true})).toBeInViewport();
  await expect(page.getByRole('button',{name:'Submit Test',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Submit Test',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Submit Test?',exact:true});
  await expect(dialog).toBeVisible();
  await noOverflow();
  const confirm=dialog.getByRole('button',{name:'Confirm Submit',exact:true});
  await confirm.scrollIntoViewIfNeeded();await expect(confirm).toBeInViewport();
  await page.screenshot({path:`tmp/test-submit-${viewport.width}.png`,fullPage:true});
  await confirm.click();await expect.poll(()=>submitted).toBe(true);
  await expect(page).toHaveURL(/\/student\/test\/result\/9$/);
  expect(errors).toEqual([]);
 });
}
