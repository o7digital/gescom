import { cp, mkdir, rm } from 'node:fs/promises';

const source = new URL('../finance-template-clean/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const copy = async path => {
  await cp(new URL(path, source), new URL(path, output), { recursive: true });
};

await mkdir(new URL('images/', output), { recursive: true });
await Promise.all([
  copy('css'), copy('js'), copy('demos/finance'),
  copy('images/logo.png'), copy('images/logo.webp'),
  copy('style.min.css'), copy('favicon.ico'), copy('robots.txt'), copy('sitemap.xml'),
]);
await rm(new URL('demos/finance/images/hero.psd', output), { force: true });
console.log('Copied the assets used by the Astro pages.');
