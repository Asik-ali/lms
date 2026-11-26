import { test, expect } from '@playwright/test';
import { jsPDF } from 'jspdf';
async function setup(page,videoUrl='https://www.youtube.com/watch?v=dQw4w9WgXcQ') {
 await page.setViewportSize({width:360,height:640});
 const user={id:'11111111-1111-4111-8111-111111111111',email:'student@example.com',user_metadata:{name:'Alex',role:'student'}};
 await page.addInitScript(user=>{localStorage.setItem('sb-lms-auth-token',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Math.floor(Date.now()/1000)+3600,user}));Element.prototype.requestFullscreen=undefined;},user);
 await page.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await page.route('https://www.youtube.com/**',r=>r.fulfill({body:'<html></html>',contentType:'text/html'}));
 await page.route('**/rest/v1/**',r=>{
 const table=new URL(r.request().url()).pathname.split('/').pop();
 return r.fulfill({json:table==='profiles'?{...user,name:'Alex',role:'student',course:'Mathematics'}:table==='courses'?{id:1,title:'Mathematics',duration:'12 weeks',status:'Published'}:table==='course_lessons'?[{id:1,title:'Video lesson',video_url:videoUrl,day:1}]:table==='course_pdf_metadata'?[{id:2,title:'Lesson notes',day:1}]:[]});
 });
 const pdf=new jsPDF();pdf.text('Protected PDF test',20,20);
 const bytes=Buffer.from(pdf.output('arraybuffer'));
 await page.route('**/api/course-pdf*',r=>{const match=(r.request().headers()['range']||'bytes=0-').match(/bytes=(\d+)-(\d*)/);const begin=Number(match[1]);const end=Math.min(bytes.length,match[2]?Number(match[2])+1:bytes.length);return r.fulfill({status:206,headers:{'access-control-expose-headers':'Content-Range, Accept-Ranges','content-type':'application/pdf','content-range':`bytes ${begin}-${end-1}/${bytes.length}`},body:bytes.subarray(begin,end)});});
 await page.goto('/student/courses/1');
 await page.getByRole('button',{name:/^Day 1/}).click();
}
test('watch video retains YouTube playback controls, sound and mobile fullscreen',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'Watch video',exact:true}).click();
 const frame=page.locator('iframe');await expect(frame).toBeVisible();
 const source=new URL(await frame.getAttribute('src'));
 expect(source.searchParams.get('controls')).toBe('1');expect(source.searchParams.get('fs')).toBe('1');
 expect(source.searchParams.get('mute')).toBeNull();expect(source.searchParams.get('autoplay')).toBeNull();expect(source.searchParams.get('loop')).toBeNull();
 await page.getByRole('button',{name:'Fullscreen video',exact:true}).click();
 await expect(page.locator('.player-shell')).toHaveClass(/player-expanded/);
 await page.getByRole('button',{name:'Exit fullscreen video'}).click();
 await page.getByRole('button',{name:'Close video'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('PDF modal shows one title and keeps page rendering and fullscreen',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'View PDF',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Lesson notes',exact:true});
 await expect(dialog.locator('canvas')).toBeVisible();
 await expect(dialog.getByText('Lesson notes',{exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Fullscreen PDF',exact:true}).click();
 await expect(page.locator('.pdf-viewer')).toHaveClass(/pdf-viewer-expanded/);
 await page.getByRole('button',{name:'Exit fullscreen PDF'}).click();
 await page.getByRole('button',{name:'Close media viewer'}).click();await expect(dialog).toHaveCount(0);
});
test('direct lesson player preserves watermark and play, pause, seek and volume controls',async({page})=>{
 await page.route('https://media.example.com/lesson.mp4',()=>{});
 await setup(page,'https://media.example.com/lesson.mp4');await page.getByRole('button',{name:'Watch video',exact:true}).click();
 const video=page.locator('video');
 await video.evaluate(video=>{Object.defineProperty(video,'duration',{value:120});video.play=async()=>video.dispatchEvent(new Event('play'));video.pause=()=>video.dispatchEvent(new Event('pause'));video.dispatchEvent(new Event('loadedmetadata'));});
 await expect(page.getByText('student@example.com',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Play lesson',exact:true}).last().click();await expect(page.getByRole('button',{name:'Pause lesson'})).toBeVisible();
 await page.getByRole('button',{name:'Mute video'}).click();await expect.poll(()=>video.evaluate(v=>v.muted)).toBe(true);
 await page.getByRole('button',{name:'Pause lesson'}).click();
 for (const viewport of [{width:360,height:640},{width:640,height:360}]) {
  await page.setViewportSize(viewport);
  await expect(page.getByRole('combobox',{name:'Playback speed'})).toBeInViewport();
  await expect(page.getByRole('button',{name:'Fullscreen video',exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
