import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:process.cwd()+'/tests/browser',testMatch:'question-content.spec.js',timeout:30000,use:{baseURL:'http://127.0.0.1:5193',channel:'chrome',headless:true},webServer:{command:'npm.cmd run dev -- --host 127.0.0.1 --port 5193 --strictPort',url:'http://127.0.0.1:5193',cwd:process.cwd(),reuseExistingServer:false}});
