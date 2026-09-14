import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.BASE_URL;
assert.ok(base, 'Set BASE_URL to the deployment to check.');
const domain = 'https://gescom.digital';
const get = path => fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
const sitemap = await get('/sitemap.xml');
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
assert.equal(xml, await readFile('finance-template-clean/sitemap.xml', 'utf8'));
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
for (const url of urls) {
  const path = new URL(url).pathname;
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), path);
  const html = await response.text();
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`), path);
  assert.ok(html.includes(`<meta property="og:url" content="${url}">`), path);
  assert.ok(html.includes(`${domain}/#website`), path);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, path);
}
for (const path of ['/demo-finance.html', '/demo-finance.html?utm_source=seo-check']) {
  const response = await get(path);
  assert.ok([301, 308].includes(response.status), path);
  const location = new URL(response.headers.get('location'), base);
  assert.equal(location.pathname, '/', path);
  assert.equal(location.search, new URL(path, base).search, path);
}
const missing = await get('/page-inexistante-test-seo');
assert.equal(missing.status, 404);
const robots = await get('/robots.txt');
assert.equal(robots.status, 200);
assert.ok((await robots.text()).includes(`Sitemap: ${domain}/sitemap.xml`));
console.log(`Verified ${urls.length} canonical pages, sharing metadata, sitemap, robots, permanent redirects and 404 on ${base}`);
