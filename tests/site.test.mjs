import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { locales, services } from '../scripts/services.mjs';

const root = new URL('../dist/', import.meta.url);
const sourceRoot = new URL('../finance-template-clean/', import.meta.url);
const domain = 'https://gescom.digital';
const files = (await readdir(root)).filter(file => file.endsWith('.html'));
const pages = new Map(await Promise.all(files.map(async file => [file, await readFile(new URL(file, root), 'utf8')])));
const footerHashes = JSON.parse(await readFile(new URL('footer-hashes.json', import.meta.url), 'utf8'));
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));
const canonical = html => tags(html, 'link').find(tag => tag.rel === 'canonical')?.href;

test('all 25 pages have a unique title, description, canonical and one H1', () => {
  assert.equal(pages.size, 25);
  const titles = new Set();
  for (const [file, html] of pages) {
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, file);
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title, file); assert.ok(!titles.has(title), file); titles.add(title);
    assert.ok(tags(html, 'meta').find(tag => tag.name === 'description')?.content, file);
    assert.equal(canonical(html), `${domain}/${file === 'index.html' ? '' : file}`, file);
    assert.ok(!/noindex/.test(html), file);
  }
});

test('sitemap covers exactly the canonical pages and language alternates are reciprocal', async () => {
  const xml = await readFile(new URL('sitemap.xml', root), 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, pages.size);
  assert.deepEqual(new Set(urls), new Set([...pages.values()].map(canonical)));
  for (const [file, html] of pages) {
    const sitemapEntry = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(([, entry]) => entry.includes(`<loc>${canonical(html)}</loc>`))[1];
    const sitemapAlternates = tags(sitemapEntry, 'xhtml:link');
    assert.deepEqual(sitemapAlternates.map(tag => [tag.hreflang, tag.href]), tags(html, 'link').filter(tag => tag.hreflang).map(tag => [tag.hreflang, tag.href]), file);
    for (const alternate of tags(html, 'link').filter(tag => tag.hreflang)) {
      const target = new URL(alternate.href).pathname.slice(1) || 'index.html';
      assert.ok(pages.has(target), `${file}: ${target}`);
      const backlinks = tags(pages.get(target), 'link').filter(tag => tag.hreflang);
      assert.ok(backlinks.some(link => link.href === canonical(html)), `${file}: reciprocal ${target}`);
    }
  }
});

test('page links and directly referenced local assets exist', async () => {
  for (const [file, html] of pages) {
    for (const tag of [...tags(html, 'a'), ...tags(html, 'link'), ...tags(html, 'script'), ...tags(html, 'img'), ...tags(html, 'source')]) {
      const value = tag.href || tag.src || tag.srcset;
      if (!value || /^(#|https?:|mailto:|tel:|data:|\/\/)/.test(value)) continue;
      const url = new URL(value, `${domain}/${file}`);
      const target = url.pathname.slice(1) || 'index.html';
      await assert.doesNotReject(access(new URL(target, root)), `${file}: ${value}`);
      if (url.hash && target.endsWith('.html')) {
        const targetHTML = pages.get(target);
        assert.ok(targetHTML?.includes(`id="${url.hash.slice(1)}"`), `${file}: missing anchor ${value}`);
      }
    }
  }
});

test('sharing metadata and structured entities describe each canonical page once', async () => {
  for (const [file, html] of pages) {
    const meta = tags(html, 'meta');
    for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:site_name', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      const matches = meta.filter(tag => (tag.property || tag.name) === key);
      assert.equal(matches.length, 1, `${file}: ${key}`);
      assert.ok(matches[0].content, `${file}: ${key}`);
    }
    assert.equal(meta.find(tag => tag.property === 'og:url').content, canonical(html), file);
    assert.equal(meta.find(tag => tag.property === 'og:description').content, meta.find(tag => tag.name === 'description').content, file);
    const image = new URL(meta.find(tag => tag.property === 'og:image').content);
    await assert.doesNotReject(access(new URL(image.pathname.slice(1), root)), file);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, file);
    const graph = JSON.parse(blocks[0][1])['@graph'];
    const ids = graph.map(node => node['@id']);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate schema entities`);
    const page = graph.find(node => ['WebPage', 'ContactPage', 'AboutPage'].includes(node['@type']));
    assert.equal(page.url, canonical(html), file);
    assert.equal(page.inLanguage, tags(html, 'html')[0].lang, file);
    assert.ok(graph.some(node => node['@type'] === 'WebSite' && node.name === 'GESCOM'), file);
    assert.ok(!/href="(?:\/|https:\/\/gescom\.digital\/)?demo-finance\.html["#?]/.test(html), `${file}: home links must use the canonical URL`);
  }
});

test('existing footer markup is preserved byte for byte', () => {
  for (const [file, hash] of Object.entries(footerHashes)) {
    const outputFile = file === 'demo-finance.html' ? 'index.html' : file;
    const footer = pages.get(outputFile).match(/<footer id="footer"[\s\S]*?<\/footer>/)[0];
    assert.equal(createHash('sha256').update(footer).digest('hex'), hash, file);
  }
});

test('home navigation, local business details and service discovery agree in every language', () => {
  for (const [language, locale] of Object.entries(locales)) {
    const html = pages.get(locale.homeFile === 'demo-finance.html' ? 'index.html' : locale.homeFile);
    const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
    assert.ok(header.includes(`href="${locale.about}"`));
    assert.ok(header.includes(`href="${locale.contact}"`));
    assert.ok(html.includes('href="tel:+18199961177"'));
    assert.ok(!html.includes('55412474') && !html.includes('noreply@canvas.com'));
    assert.match(html, /<title>[^<]*Mauricie/);
    for (const service of services) assert.ok(html.includes(`href="${service[language].slug}.html"`));
  }
  for (const [file, html] of pages) {
    for (const [, block] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const schema = JSON.parse(block);
      const business = (schema['@graph'] || [schema]).find(item => item['@type'] === 'ProfessionalService');
      assert.equal(business.telephone, '+1-819-996-1177', file);
      assert.equal(business.address.addressLocality, 'Saint-Élie-de-Caxton', file);
      assert.ok(business.areaServed.some(area => area.name === 'Mauricie, Québec'), file);
    }
  }
});

test('optimized pages use deferred modular scripts and a smaller stylesheet', async () => {
  for (const [file, html] of pages) {
    assert.ok(html.includes('style.min.css'), file);
    assert.ok(!html.includes('js/plugins.min.js') && !html.includes('js/functions.bundle.js'), file);
    for (const script of tags(html, 'script').filter(tag => tag.src?.startsWith('js/'))) {
      assert.ok(html.includes(`src="${script.src}" defer`), `${file}: ${script.src}`);
    }
  }
  assert.ok((await stat(new URL('style.min.css', root))).size < (await stat(new URL('style.css', sourceRoot))).size * 0.85);
});
