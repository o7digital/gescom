import { readFile, writeFile } from 'node:fs/promises';

const domain = 'https://gescom.digital';
const image = `${domain}/demos/finance/images/aurelie-portrait.webp`;
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)])));

// Derive search and sharing metadata from the visible page's own title and
// description. Rebuilding replaces existing metadata instead of duplicating it.
export async function finalizeSEO(root, paths, business) {
  const sitemap = [];
  for (const path of paths) {
    const file = new URL(path === '/' ? 'demo-finance.html' : path.slice(1), root);
    let html = await readFile(file, 'utf8');
    const title = decode(html.match(/<title>(.*?)<\/title>/s)[1]);
    const description = tags(html, 'meta').find(tag => tag.name === 'description').content;
    const language = tags(html, 'html')[0].lang;
    const canonical = `${domain}${path}`;
    const alternates = tags(html, 'link').filter(tag => tag.hreflang);
    const schemaBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const graph = schemaBlocks.flatMap(([, json]) => {
      const schema = JSON.parse(json);
      return schema['@graph'] || [schema];
    }).filter(node => !['WebSite', 'WebPage', 'AboutPage', 'ContactPage'].includes(node['@type']));
    if (!graph.some(node => node['@type'] === 'ProfessionalService')) graph.unshift({ ...business });
    for (const node of graph) delete node['@context'];
    graph.push({
      '@type': 'WebSite', '@id': `${domain}/#website`, url: `${domain}/`,
      name: 'GESCOM', publisher: { '@id': `${domain}/#business` },
      inLanguage: ['fr-CA', 'en-CA', 'es'],
    }, {
      '@type': /\/(a-propos|about-en|acerca-de)\.html$/.test(path) ? 'AboutPage'
        : /\/(contact|contact-en|contacto)\.html$/.test(path) ? 'ContactPage' : 'WebPage',
      '@id': `${canonical}#webpage`, url: canonical, name: title, description,
      inLanguage: language, isPartOf: { '@id': `${domain}/#website` },
      about: { '@id': `${domain}/#business` },
      ...(graph.some(node => node['@type'] === 'Service') ? { mainEntity: { '@id': `${canonical}#service` } } : {}),
    });
    const locale = { 'fr-CA': 'fr_CA', 'en-CA': 'en_CA', es: 'es_CA' }[language] || language.replace('-', '_');
    const meta = {
      'og:type': 'website', 'og:site_name': 'GESCOM', 'og:locale': locale,
      'og:title': title, 'og:description': description, 'og:url': canonical,
      'og:image': image, 'og:image:alt': 'Aurélie Genin — GESCOM',
      'twitter:card': 'summary_large_image', 'twitter:title': title,
      'twitter:description': description, 'twitter:image': image,
      'twitter:image:alt': 'Aurélie Genin — GESCOM',
    };
    const metadata = Object.entries(meta).map(([key, value]) => `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escape(value)}">`).join('\n');
    html = html.replace(/\s*<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g, '')
      .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
      .replace(/\s*<\/head>/, () => `\n${metadata}\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replaceAll('<', '\\u003c')}</script>\n</head>`)
      .replace(/href="(?:\/|https:\/\/gescom\.digital\/)?demo-finance\.html(?=["#?])/g, 'href="/');
    await writeFile(file, html);
    sitemap.push(`  <url>\n    <loc>${canonical}</loc>\n${alternates.map(tag => `    <xhtml:link rel="alternate" hreflang="${escape(tag.hreflang)}" href="${escape(tag.href)}" />`).join('\n')}\n  </url>`);
  }
  await writeFile(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.join('\n')}\n</urlset>\n`);
}
