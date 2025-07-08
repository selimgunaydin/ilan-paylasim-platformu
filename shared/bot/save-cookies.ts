import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${SITE_URL}/auth`);
  console.log('Elle giriş yap ve ardından bu pencereyi kapatma!');
  await page.waitForTimeout(20000); // 20 saniye bekle (gerekirse artır)
  await context.storageState({ path: 'auth.json' });
  await browser.close();
  console.log('Çerezler auth.json dosyasına kaydedildi.');
})();
