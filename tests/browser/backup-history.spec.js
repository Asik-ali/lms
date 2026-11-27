import {test,expect} from '@playwright/test';
async function setup(page){
 const user={id:'11111111-1111-4111-8111-111111111111',email:'admin@example.com',user_metadata:{name:'Admin',role:'admin'}};
 await page.addInitScript(user=>localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user})),user);
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('**/rest/v1/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/profiles')?{...user,name:'Admin',role:'admin'}:[]}));
}
test('history displays download and email runs with Sheets configuration and the actual last success',async({page})=>{
 await setup(page);let release;
 await page.route('**/api/backup*',async r=>{await new Promise(resolve=>release=resolve);await r.fulfill({json:{lastSuccessful:'2026-11-20T10:00:00Z',googleSheetsConfigured:false,backups:[{id:2,type:'manual',status:'failed',created_at:'2026-11-27T10:00:00Z',record_counts:{audit_logs:-1},error:'Earlier missing table',emailed_to:[]},{id:1,type:'download',status:'success',created_at:'2026-11-20T10:00:00Z',record_counts:{courses:25},emailed_to:[]}]}});});
 await page.goto('/admin/settings/backup');
 await expect(page.getByText('Loading backup history...',{exact:true})).toBeVisible();
 await expect(page.getByText('No backup runs have been recorded yet.',{exact:true})).toHaveCount(0);
 release();await expect(page.getByText('Backup download export',{exact:true})).toBeVisible();
 await expect(page.getByText('Manual email backup',{exact:true})).toBeVisible();
 await expect(page.getByText('Google Sheets backup: Not configured',{exact:true})).toBeVisible();
 await expect(page.getByText(/Last backup:/)).toContainText('20/11/2026');
});
