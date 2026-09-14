import { readFile, readdir } from 'node:fs/promises';

const source = new URL('finance-template-clean/', `file://${process.cwd()}/`);

export async function pageNames() {
  return (await readdir(source))
    .filter(file => file.endsWith('.html') && file !== 'demo-finance.html')
    .map(file => file.slice(0, -5));
}

function attributes(markup) {
  return Object.fromEntries([...markup.matchAll(/([:\w-]+)(?:="([^"]*)")?/g)]
    .slice(1)
    .map(([, key, value]) => [key, value ?? true]));
}

export async function loadPage(file) {
  const html = await readFile(new URL(file, source), 'utf8');
  const document = html.match(/<html\b([^>]*)>([\s\S]*?)<\/html>/i);
  const head = document?.[2].match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  const body = document?.[2].match(/<body\b([^>]*)>([\s\S]*?)<\/body>/i);
  if (!document || head === undefined || !body) throw new Error(`Invalid legacy document: ${file}`);
  return {
    htmlAttributes: attributes(`<html${document[1]}>`),
    bodyAttributes: attributes(`<body${body[1]}>`),
    head,
    body: body[2],
  };
}
