import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { startServer } from './server.mjs';
import { locales, services } from '../scripts/services.mjs';

const local = process.env.BASE_URL ? null : await startServer();
const baseURL = process.env.BASE_URL || local.baseURL;
const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
await mkdir('test-results', { recursive: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    // Intercept submissions: tests never send messages to GESCOM or the chat service.
    await context.route('**/*', route => {
      const request = route.request();
      if (request.method() !== 'GET' && request.method() !== 'HEAD') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"alert":"success","message":"Test","ok":true}' });
      if (request.url().startsWith('https://olivia-ai.')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(baseURL) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const [language, locale] of Object.entries(locales)) {
      await page.goto(baseURL + locale.home, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!window.SEMICOLON?.Core.getVars.resizers.menus);
      if (width === 390) {
        await page.locator('.primary-menu-trigger button').click();
        await expect(page.locator('header .menu-container')).toBeVisible();
      }
      await expect(page.locator(`header a[href="${locale.about}"]`)).toBeVisible();
      await expect(page.locator(`header a[href="${locale.contact}"]`)).toBeVisible();
      if (width === 390) await page.locator('.primary-menu-trigger button').click();
      await page.waitForFunction(() => !!window.jQuery?.('#template-contactform').data('validator'));
      await page.locator('#template-contactform-submit').click();
      await expect(page.locator('#template-contactform-email')).toHaveClass(/error/);
      await page.locator('.olivia-launcher').click();
      await expect(page.locator('#olivia-chat-root')).toHaveClass(/is-open/);
      await page.locator('.olivia-close').click();
      const guide = page.locator('section[aria-labelledby="local-support"]');
      await expect(guide.locator('details')).toHaveCount(4);
      await guide.locator('summary').first().click();
      await expect(guide.locator('details').first()).toHaveAttribute('open', '');
      for (const service of services) await expect(guide.locator(`a[href="${service[language].slug}.html"]`)).toBeVisible();
      if (width === 390) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `${language}: home overflow`);
      if (language === 'fr') {
        await guide.screenshot({ path: `test-results/home-content-${width}.png` });
        await page.locator('#footer').screenshot({ path: `test-results/footer-${width}.png` });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `test-results/home-${width}.png` });
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(resource => resource.name.includes('/js/')).map(resource => ({ path: new URL(resource.name).pathname, bytes: resource.decodedBodySize })));
        await writeFile(`test-results/resources-${width}.json`, JSON.stringify(resources, null, 2));
        const bytes = resources.reduce((sum, resource) => sum + resource.bytes, 0);
        if (local) assert.ok(bytes > 0 && bytes < 530000, `JS budget exceeded: ${bytes}`);
        console.log(`Home ${width}px: ${bytes} JS bytes (uncompressed)`);
      }
      for (const service of services) {
        await page.goto(`${baseURL}/${service[language].slug}.html`, { waitUntil: 'networkidle' });
        await expect(page.locator('h1')).toHaveText(service[language].title);
        await page.locator('details summary').first().click();
        await expect(page.locator('details').first()).toHaveAttribute('open', '');
        await expect(page.locator(`main a[href="${locale.contact}"]`).first()).toBeVisible();
        if (width === 390) {
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
          assert.equal(overflow, false, `${service[language].slug}: horizontal overflow`);
        }
        if (language === 'fr' && service === services[0]) await page.screenshot({ path: `test-results/service-${width}.png`, fullPage: true });
      }
      await page.goto(`${baseURL}/${locale.contact}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!window.jQuery?.('#template-contactform').data('validator'));
      await page.locator('#template-contactform-submit').click();
      await expect(page.locator('#template-contactform-email')).toHaveClass(/error/);
      console.log(`Passed ${language}, ${width}px: home, four services, contact, menu, validation and chat`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
  await local?.close();
}
