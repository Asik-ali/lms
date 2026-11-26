import { test, expect } from '@playwright/test';
async function setup(page,count) {
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',user_metadata:{name:'Alex',role:'student'}};
 await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),user);
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('**/rest/v1/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/profiles')?{...user,name:'Alex',role:'student'}:[]}));
 await page.route('**/api/order-status*',r=>{
  const page=Number(new URL(r.request().url()).searchParams.get('page')||0);
  return r.fulfill({json:{rewardAmount:100,count,referrals:Array.from({length:Math.min(25,Math.max(0,count-page*25))},(_,i)=>({id:page*25+i,created_at:'2026-01-01',reward_amount:0,referred:{name:`Friend ${page*25+i+1}`}}))}});
 });
}
for(const count of [0,1,26])test(`referral navigation only shows available pages for ${count} entries`,async({page})=>{
 await setup(page,count);await page.goto('/student/referrals');
 await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Previous',exact:true})).toHaveCount(0);
 if(count<=25)await expect(page.getByRole('button',{name:'Next',exact:true})).toHaveCount(0);
 else {
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Friend 26',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Friend 1',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Previous',exact:true})).toHaveCount(0);
 }
 await page.getByRole('button',{name:'Go back to previous page'}).click();
 await expect(page).toHaveURL(/\/student$/);
});
