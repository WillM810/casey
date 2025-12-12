import * as fs from 'fs';
import * as path from 'path';
// import * as cheerio from 'cheerio';
import { URL, fileURLToPath } from 'url';
import { parseArgs } from './parse-args.js';
import * as crypto from 'crypto';

type argsType = {
    _: string[];
    output?: string;
    o?: string;
};

const args = parseArgs() as argsType;
const OUTPUT_DIR = path.join(process.cwd(), (args.o || args.output || 'site-rip-output/'));
const BASE_URL = args._[0] || 'https://example.com/';
const HTTP_ALIAS = /https/.test(BASE_URL) ? BASE_URL.replace(/https/, 'http') : BASE_URL.replace(/http/, 'https');

const visitedUrls = new Set<string>();

function sanitizeFilename(urlStr: string): string {
    const [url, search] = urlStr.split('?');
    const hash = search ? crypto.createHash('md5').update(search).digest('hex').slice(0, 8) : '';

    const [file, ext] = url.split('.');
    return file + (hash ? `_${hash}` : '') + (ext ? `.${ext}` : '');
}

function normalizeUrl(urlStr: string): string {
    const resolvedUrl = new URL(urlStr);
    const explicitUrl = resolvedUrl.pathname.endsWith('/') ? new URL('index.html', resolvedUrl) :
        !resolvedUrl.pathname.includes('.') ? new URL(resolvedUrl.toString() + '/index.html') : resolvedUrl;
    explicitUrl.search = resolvedUrl.search;
    const hash = explicitUrl.search ? crypto.createHash('md5').update(explicitUrl.search).digest('hex').slice(0, 8) : '';
    explicitUrl.search = '';
    const [file, ext] = explicitUrl.pathname.split('.');
    explicitUrl.pathname = file + (hash ? `_${hash}` : '') + (ext ? `.${ext}` : '');
    return explicitUrl.toString();
}

async function processPage(pageUrl: string, localDir: string) {
    fs.mkdirSync(localDir, { recursive: true });

    // Prevent re-processing the same URL
    if (visitedUrls.has(pageUrl)) return;
    visitedUrls.add(pageUrl);

    console.log(`\n\n======\n\nProcessing page: ${pageUrl} into directory: ${localDir}`);
    
    const pagePath = normalizeUrl(pageUrl).replace(BASE_URL, OUTPUT_DIR);

    const res = await fetch(pageUrl);
    const contentType = res.headers.get('content-type').split(';')[0];
    let content: string | Buffer | undefined;
    switch (contentType) {
        case 'text/html':
            content = await res.text();

            // Remove <base> tags
            content = content.replace(/<base[^>]*>/g, '');
            content = content.replaceAll(BASE_URL, '/').replaceAll(HTTP_ALIAS, '/');

            // Here you would parse the HTML, find assets and links, and process them accordingly.
            content = content.replace(/(href|src|action)=["'](\/[^"']*?)["']/g, (match, p1, p2) => {
                const absoluteUrl = new URL(p2, BASE_URL).toString();
                console.log(`\n\nFound asset/link (${p1}):`, absoluteUrl, 'on page:', pageUrl);
                const relPath = p1 !== 'action' ?
                    normalizeUrl(absoluteUrl).replace(BASE_URL, './') :
                    absoluteUrl.replace(BASE_URL, '/');
                console.log('Mapped to relative path:', relPath, 'from base dir:', localDir);
                const localPath = path.join(OUTPUT_DIR, relPath);
                console.log('Full local path:', localPath);
                // Schedule asset for download
                if (p1 !== 'action') processPage(absoluteUrl, path.dirname(localPath));
                const rContent = p1 !== 'action' ?
                    `${p1}="./${path.relative(localDir, localPath).replace(/\\/g, '/')}"` :
                    `${p1}="/${path.relative(OUTPUT_DIR, localPath).replace(/\\/g, '/')}"`;
                console.log(`Replaced "${match}" with:`, rContent);
                return rContent;
            });
            // For simplicity, we just save the HTML content directly.
            fs.writeFileSync(pagePath, content as string);
            break;
        case 'text/css':
            content = await res.text();
            content = content.replace(/url\(([^)]+)\)/g, (match, p1) => {
                const assetUrl = p1.replace(/['"]/g, '');
                console.log('\n\nFound CSS asset:', assetUrl, 'on page:', pageUrl);
                const absoluteUrl = new URL(assetUrl, pageUrl).toString();
                console.log('Resolved to absolute URL:', absoluteUrl);
                const relPath = normalizeUrl(absoluteUrl).replace(BASE_URL, './');
                console.log('Mapped to relative path:', relPath, 'from:', localDir);
                const localPath = path.resolve(OUTPUT_DIR, relPath);
                console.log('Full local path:', localPath);
                // Schedule asset for download
                processPage(absoluteUrl, path.dirname(localPath));
                const rContent = `url(./${path.relative(localDir, localPath).replace(/\\/g, '/')})`;
                console.log(`Replaced "${match}" with:`, rContent);
                return rContent;
            });
            fs.writeFileSync(pagePath, content as string);
            break;
        case 'application/javascript':
            content = await res.text();
            fs.writeFileSync(pagePath, content as string);
            break;
        case 'image/png':
        case 'image/jpeg':
        case 'image/gif':
        case 'image/svg+xml':
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(pagePath, Buffer.from(buffer));
            break;
        default:
            console.log('Unknown content type:', res.headers.get('content-type'));
    }
    
}

(async () => { await processPage(BASE_URL, OUTPUT_DIR); })();