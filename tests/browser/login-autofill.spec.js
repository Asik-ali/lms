import { test, expect } from '@playwright/test';
for(const native of [false,true])test(`${native?'native app':'website'} login uses the intended password suggestion settings`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 if(native)await page.addInitScript(()=>{window.CapacitorCustomPlatform={name:'android'};});
 await page.route('**/auth/v1/**',r=>r.fulfill({json:{user:null}}));
 await page.goto('/login');
 const username=page.getByLabel('Username or email',{exact:true}),password=page.getByLabel('Password',{exact:true});
 await expect(username).toBeVisible();
 await expect(page.locator('form[name="examstick-login"]')).toHaveAttribute('autocomplete',native?'off':'on');
 await expect(username).toHaveAttribute('autocomplete',native?'off':'username');
 await expect(password).toHaveAttribute('autocomplete',native?'off':'current-password');
 if(native)await expect(username).not.toBeFocused();
 await username.fill('student@example.com');await password.fill('example-password');
 await page.getByRole('button',{name:'Show password',exact:true}).click();await expect(password).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'Hide password',exact:true}).click();await expect(password).toHaveAttribute('type','password');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
