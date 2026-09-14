import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { locales, services } from './services.mjs';
import { finalizeSEO } from './seo.mjs';
import { homeContent, serviceContent } from './content.mjs';

const root = new URL('../finance-template-clean/', import.meta.url);
const domain = 'https://gescom.digital';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const paragraphs = values => values.map(value => `<li class="mb-3">${escape(value)}</li>`).join('\n');
const renderQuestions = questions => questions.map(([question, answer]) => `<details class="border-bottom py-3"><summary class="fw-semibold">${escape(question)}</summary><p class="mt-3 mb-0">${escape(answer)}</p></details>`).join('\n');

export const business = {
  '@type': 'ProfessionalService', '@id': `${domain}/#business`,
  name: 'GESCOM', legalName: '9517-6806 Québec inc', url: `${domain}/`,
  telephone: '+1-819-996-1177', email: 'gescom.mauricie@gmail.com',
  address: {
    '@type': 'PostalAddress', streetAddress: '1030, avenue Muguette',
    addressLocality: 'Saint-Élie-de-Caxton', addressRegion: 'QC', postalCode: 'G0X 2N0', addressCountry: 'CA',
  },
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Mauricie, Québec' },
    { '@type': 'City', name: 'Trois-Rivières' }, { '@type': 'City', name: 'Shawinigan' },
    { '@type': 'City', name: 'Saint-Élie-de-Caxton' }, { '@type': 'Country', name: 'Canada' },
  ],
  image: `${domain}/demos/finance/images/aurelie-portrait.webp`,
  logo: `${domain}/images/logo.webp`,
};

for (const [language, locale] of Object.entries(locales)) {
  const homeFile = new URL(locale.homeFile, root);
  const home = homeContent[language];
  const homeHTML = await readFile(homeFile, 'utf8');
  const homeSection = `<!-- Generated home content -->
<section class="container mw-md py-5" aria-labelledby="local-support">
  <h2 id="local-support" class="h3 font-body color">${escape(home.title)}</h2>
  <p class="lead">${escape(locale.local)}</p><p>${escape(home.intro)}</p>
  <h2 class="h3 font-body color mt-5">${escape(home.choiceTitle)}</h2>
  <ul class="ps-4">${home.choices.map((choice, index) => `<li class="mb-3">${escape(choice)} <a class="color text-decoration-underline" href="${services[index][language].slug}.html">${escape(services[index][language].title)}</a></li>`).join('\n')}</ul>
  <h2 class="h3 font-body color mt-5">${escape(locale.processTitle)}</h2>
  <p>${escape(home.processIntro)}</p><ol class="ps-4">${paragraphs(locale.process)}</ol>
  <h2 class="h3 font-body color mt-5">${escape(locale.faq)}</h2>
  ${renderQuestions(home.questions)}
  <p class="mt-4"><a href="${locale.contact}" class="btn btn-dark bg-color rounded-pill px-4 py-3">${escape(locale.cta)}</a></p>
</section>
<!-- End generated home content -->`;
  const homePattern = /<!-- Generated home content -->[\s\S]*?<!-- End generated home content -->|<section class="container mw-md py-5" aria-labelledby="local-support">[\s\S]*?<\/section>/;
  if (!homePattern.test(homeHTML)) throw new Error(`Missing home content section: ${locale.homeFile}`);
  await writeFile(homeFile, homeHTML.replace(homePattern, () => homeSection));
  const template = await readFile(new URL(locale.about, root), 'utf8');
  for (const service of services) {
    const content = service[language];
    const editorial = serviceContent[service.fr.slug][language];
    const file = `${content.slug}.html`;
    const canonical = `${domain}/${file}`;
    let head = template.slice(0, template.indexOf('</head>'));
    head = head.replace(/<title>.*?<\/title>/s, `<title>${escape(content.title)} | GESCOM</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(content.description)}">`)
      .replace(/\s*<link rel="(?:canonical|alternate)"[^>]*>/g, '')
      .replace(/\s*<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g, '')
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    const alternates = Object.keys(locales).map(lang => `<link rel="alternate" hreflang="${lang}" href="${domain}/${service[lang].slug}.html">`).join('\n');
    const structured = {
      '@context': 'https://schema.org', '@graph': [business, {
        '@type': 'Service', '@id': `${canonical}#service`, name: content.title,
        description: content.description, url: canonical, provider: { '@id': business['@id'] }, areaServed: business.areaServed,
      }, {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: locale.homeLabel, item: `${domain}${locale.home}` },
          { '@type': 'ListItem', position: 2, name: content.title, item: canonical },
        ],
      }],
    };
    head += `\n<link rel="canonical" href="${canonical}">\n${alternates}
<link rel="alternate" hreflang="x-default" href="${domain}/${service.fr.slug}.html">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(content.title)} | GESCOM">
<meta property="og:description" content="${escape(content.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${business.image}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(structured, null, 2)}</script>
</head>`;
    let header = template.slice(template.indexOf('<body'), template.indexOf('</header>') + 9);
    header = header.replace(/menu-item current/g, 'menu-item')
      .replace(/<li class="menu-item"><a class="menu-link" href="[^"]*#services"/, '<li class="menu-item current"><a class="menu-link" href="' + locale.home + '#services"');
    for (const [lang, target] of Object.entries(locales)) {
      if (lang !== language) header = header.replaceAll(`href="${target.about}"`, `href="${service[lang].slug}.html"`);
    }
    const footer = template.slice(template.indexOf('<footer id="footer"'));
    const related = services.filter(other => other !== service).map(other => `<li class="mb-2"><a href="${other[language].slug}.html">${escape(other[language].title)}</a></li>`).join('\n');
    const questions = renderQuestions([...content.questions, ...editorial.questions]);
    const sections = editorial.sections.map(([title, text]) => `<section class="my-5"><h2 class="h3 font-body color">${escape(title)}</h2><p>${escape(text)}</p></section>`).join('\n');
    const body = `
<main id="content">
  <section class="py-5" style="background: #2646532b">
    <div class="container mw-md">
      <nav aria-label="${language === 'fr' ? 'Fil d’Ariane' : language === 'es' ? 'Ruta de navegación' : 'Breadcrumb'}" class="mb-4"><a href="${locale.home}">${locale.homeLabel}</a> / <span aria-current="page">${escape(content.title)}</span></nav>
      <h1 class="display-5 fw-bold color font-body">${escape(content.title)}</h1>
      <p class="lead mt-4">${escape(content.intro)}</p>
      <a href="${locale.contact}" class="btn btn-dark bg-color rounded-pill px-4 py-3 mt-2">${escape(locale.cta)}</a>
    </div>
  </section>
  <div class="container mw-md py-5">
    <p>${escape(locale.local)}</p>
    <section class="my-5"><h2 class="h3 font-body color">${locale.includes}</h2><ul class="mt-4 ps-4">${paragraphs(content.tasks)}</ul></section>
    <section class="p-4 rounded-6 my-5" style="background: #2646530d"><h2 class="h3 font-body color">${locale.example}</h2><p class="mb-0">${escape(content.example)}</p></section>
    ${sections}
    <section class="my-5"><h2 class="h3 font-body color">${locale.prepare}</h2><p>${escape(content.prepare)}</p></section>
    <section class="my-5"><h2 class="h3 font-body color">${locale.processTitle}</h2><ol class="mt-4 ps-4">${paragraphs(locale.process)}</ol></section>
    <section class="my-5"><h2 class="h3 font-body color">${locale.faq}</h2>${questions}</section>
    <section class="my-5"><h2 class="h3 font-body color">${locale.related}</h2><ul class="ps-4">${related}</ul></section>
    <section class="rounded-6 p-4 p-md-5" style="background: #2646531b"><h2 class="h3 font-body color">${escape(locale.cta)}</h2><p>${escape(locale.ctaText)}</p><a href="${locale.contact}" class="btn btn-dark bg-color rounded-pill px-4 py-3">${escape(locale.cta)}</a><p class="mt-4 mb-0"><a href="tel:+18199961177">+1 (819) 996-1177</a> · <a href="mailto:gescom.mauricie@gmail.com">gescom.mauricie@gmail.com</a></p></section>
  </div>
</main>
`;
    await writeFile(new URL(file, root), head + '\n' + header + body + footer);
  }
}

// The sitemap is explicit: template/demo files are never added automatically.
const existing = ['/', '/demo-finance-en.html', '/demo-finance-es.html', '/contact.html', '/contact-en.html', '/contacto.html', '/a-propos.html', '/about-en.html', '/acerca-de.html', '/politique-confidentialite.html', '/mentions-legales.html', '/privacy-policy.html', '/politica-de-privacidad.html'];
const servicePaths = services.flatMap(service => Object.keys(locales).map(lang => `/${service[lang].slug}.html`));
await finalizeSEO(root, [...existing, ...servicePaths], business);

// Keep the source files editable; preserve every CSS rule, including the footer.
for (const [source, output] of [['style.css', 'style.min.css'], ['js/functions.js', 'js/functions.min.js']]) {
  await build({ entryPoints: [new URL(source, root).pathname], outfile: new URL(output, root).pathname, minify: true, target: ['es2020', 'chrome90', 'safari14'], legalComments: 'inline' });
}
console.log('Built home content, 12 service pages, SEO metadata, sitemap and minified CSS/JS.');
