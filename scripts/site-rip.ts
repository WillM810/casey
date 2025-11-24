import * as fs from 'fs';
import * as path from 'path';
// import * as cheerio from 'cheerio';
import { URL } from 'url';

// // Configuration
// const BASE_URL = 'https://timeandpatiencetherapy.com/';
// const OUTPUT_DIR = path.join(process.cwd(), 'public', 'casey');

// const visitedUrls = new Set<string>();

// function sanitizeFilename(url: string): string {
//     return url.split('?')[0];
// }

// async function recurseAssets(url: string, buffer: ArrayBuffer) {
//     if (url.endsWith('.css')) {
//         const content = Buffer.from(buffer).toString('utf-8');
//         const assetUrls = Array.from(content.matchAll(/url\(([^)]+)\)/g)).map(m => m[1].replace(/['"]/g, ''));
//         return assetUrls.map(assetUrl => fetchAndSave(new URL(assetUrl, url).toString(), path.join(OUTPUT_DIR, sanitizeFilename(new URL(assetUrl, url).pathname))));
//     }
// }

// async function fetchAndSave(url: string, localPath: string) {
//     try {
//         if (visitedUrls.has(url)) return;
//         visitedUrls.add(url);
//         console.log('Fetching asset:', url);
//         const res = await fetch(url);
//         if (!res.ok) return console.error('Failed:', url, res.status);

//         const buffer = await res.arrayBuffer();
//         await recurseAssets(url, buffer);
//         fs.mkdirSync(path.dirname(localPath), { recursive: true });
//         fs.writeFileSync(localPath, Buffer.from(buffer));
//     } catch (err) {
//         console.error('Error fetching', url, err);
//     }
// }

// async function processPage(pageUrl: string, localDir: string) {
//     if (visitedUrls.has(pageUrl)) return;
//     visitedUrls.add(pageUrl);
//     console.log('Downloading:', pageUrl);
//     const res = await fetch(pageUrl);
//     const html = await res.text();

//     const $ = cheerio.load(html);

//     // Remove <base> tags
//     $('base').remove();

//     // Collect assets
//     const assets: { url: string; localPath: string }[] = [];

//     $('img, script, link[rel="stylesheet"]').each((_, el) => {
//         const attr = el.tagName === 'link' ? 'href' : 'src';
//         let assetUrl = $(el).attr(attr);
//         if (!assetUrl) return;

//         if (assetUrl.startsWith('//')) assetUrl = 'https:' + assetUrl;
//         if (assetUrl.startsWith('/')) assetUrl = new URL(assetUrl, BASE_URL).toString();

//         if (!assetUrl.startsWith(BASE_URL)) return; // don't follow outside links
//         const relPath = sanitizeFilename(assetUrl.replace(BASE_URL, './'));
//         const localPath = path.join(localDir, relPath);
//         $(el).attr(attr, './' + path.relative(localDir, localPath).replace(/\\/g, '/'));
//         assets.push({ url: assetUrl, localPath });
//     });

//     await Promise.all($('a').map(async (_, el) => {
//         let linkUrl = $(el).attr('href');
//         if (!linkUrl) return;
//         console.log('Found link:', linkUrl);
//         let mirrorUrl = linkUrl;
//         if (linkUrl.startsWith('/')) mirrorUrl = '.' + linkUrl + '/index.html';
//         $(el).attr('href', mirrorUrl);
//         if (mirrorUrl.startsWith('./'))
//             await processPage(new URL(linkUrl, BASE_URL).toString(), path.join(localDir, sanitizeFilename(new URL(linkUrl, BASE_URL).pathname)));
//     }));

//     // Save the page
//     const pagePath = path.join(localDir, 'index.html');
//     fs.mkdirSync(path.dirname(pagePath), { recursive: true });
//     fs.writeFileSync(pagePath, $.html());

//     // Download assets
//     await Promise.all(assets.map(a => fetchAndSave(a.url, a.localPath)));
// }

// async function main() {
//     await processPage(BASE_URL, OUTPUT_DIR);

//     console.log('Site mirror completed.');
// }

// main();
console.log('Site rip script placeholder.');