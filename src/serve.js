#!/usr/bin/env node
/**
 * Local preview server for the built site (no dependencies).
 *
 *   node src/serve.js               → http://localhost:3000 (or the next free port)
 *   node src/serve.js 5000 --open   → starts at port 5000 and opens the browser
 *
 * Serves ./site with gzip, like a production web server would.
 * It listens on this computer only (127.0.0.1 and ::1), so no firewall prompt appears,
 * and it skips any port another program is already using (e.g. a database tool on 8080).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { exec } = require('child_process');

const { handleEnquiry } = require('./preview-mailer');

const PROJECT = path.resolve(__dirname, '..');
const ROOT = path.join(PROJECT, 'site');
const args = process.argv.slice(2);
const START_PORT = Number(args.find((a) => /^\d+$/.test(a))) || 3000;
const OPEN = args.includes('--open');
const TRIES = 30;
const CHECK_PATH = '/__preview-check';
const TOKEN = `brand-image-preview-${process.pid}-${Date.now()}`;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400);
    return res.end();
  }
  if (urlPath === CHECK_PATH) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(TOKEN);
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT) || /(^|[\\/])(\.|lib[\\/])/.test(path.relative(ROOT, file))) {
    res.writeHead(403);
    return res.end();
  }
  // This preview cannot run PHP. The contact form's mailer (send-enquiry.php) is answered by
  // src/preview-mailer.js instead, which does the same here: it emails the enquiry through the SMTP
  // account in the project folder's .env. Other .php files are never served (their code stays private).
  if (path.extname(file).toLowerCase() === '.php') {
    if (path.basename(file).toLowerCase() === 'send-enquiry.php') {
      return handleEnquiry(req, res, PROJECT).catch((err) => {
        console.error(`  Contact form: ${err.message}`);
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, message: 'Sorry, your enquiry could not be sent.' }));
      });
    }
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
    }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    const compressible = /\.(html|css|js|json|xml|txt|webmanifest)$/.test(ext);
    if (compressible && /gzip/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      return res.end(zlib.gzipSync(data));
    }
    res.writeHead(200, headers);
    return res.end(data);
  });
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

// Ask the address what it is: 'ours', 'other' (another program answered) or 'none'.
function probe(host, port) {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: CHECK_PATH, timeout: 1500 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body === TOKEN ? 'ours' : 'other'));
    });
    req.on('timeout', () => { req.destroy(); resolve('other'); });
    req.on('error', () => resolve('none'));
  });
}

async function start() {
  for (let port = START_PORT; port < START_PORT + TRIES; port++) {
    const v4 = http.createServer(handler);
    try {
      await listen(v4, port, '0.0.0.0');
    } catch (e) {
      continue; // port in use
    }
    const v6 = http.createServer(handler);
    let hasV6 = false;
    try {
      await listen(v6, port, '::1');
      hasV6 = true;
    } catch (e) {
      if (e.code === 'EADDRINUSE') {
        v4.close();
        continue; // another program answers on [::1]:port
      }
      // no IPv6 on this computer: 127.0.0.1 is enough
    }
    const ok4 = (await probe('127.0.0.1', port)) === 'ours';
    const ok6 = !hasV6 || (await probe('::1', port)) === 'ours';
    if (ok4 && ok6) return port;
    v4.close();
    if (hasV6) v6.close();
  }
  throw new Error(`no free port between ${START_PORT} and ${START_PORT + TRIES - 1}`);
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

start()
  .then((port) => {
    const url = `http://localhost:${port}/`;
    console.log('');
    console.log(`  Brand Image website is running at ${url}`);
    if (port !== START_PORT) console.log(`  (port ${START_PORT} is used by another program, so ${port} is used instead)`);
    console.log('  Keep this window open while you look around. Close it or press Ctrl+C to stop.');
    console.log('');
    if (OPEN) openBrowser(url);
  })
  .catch((err) => {
    console.error(`  Could not start the preview: ${err.message}`);
    process.exit(1);
  });
