/**
 * The contact form's mailer for the local preview (src/serve.js), so enquiries sent from the preview are
 * emailed too. It does what site/send-enquiry.php does on the hosting (that file needs PHP, which the
 * preview does not have): the same checks, the same { ok, message } answer and the same email, sent
 * through the SMTP account in the project folder's .env (see .env.example). Built-in modules only.
 *
 *   handleEnquiry(req, res, projectDir)   answers a POST to send-enquiry.php
 *   checkSmtp(projectDir)                 logs in to the SMTP server and leaves without sending anything
 */
const fs = require('fs');
const net = require('net');
const tls = require('tls');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MAX_BODY = 64 * 1024;

/* ---------------------------------------------------------------- settings (.env) */
/** KEY=VALUE lines of the first .env found (project folder, then site/), as send-enquiry.php reads them. */
function loadEnv(projectDir) {
  for (const file of [path.join(projectDir, '.env'), path.join(projectDir, 'site', '.env')]) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }
    const values = {};
    for (let line of text.split(/\r?\n/)) {
      line = line.trim();
      if (!line || line[0] === '#' || !line.includes('=')) continue;
      const at = line.indexOf('=');
      const key = line.slice(0, at).trim();
      let value = line.slice(at + 1).trim();
      if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])) value = value.slice(1, -1);
      values[key] = value;
    }
    return values;
  }
  return {};
}

function settings(projectDir) {
  const env = loadEnv(projectDir);
  const get = (key, fallback = '') => process.env[key] || env[key] || fallback;
  const port = Number(get('SMTP_PORT', '465'));
  return {
    host: get('SMTP_HOST'),
    port,
    secure: get('SMTP_SECURE', port === 465 ? 'ssl' : 'tls').toLowerCase(),
    user: get('SMTP_USER'),
    pass: get('SMTP_PASS'),
    from: get('MAIL_FROM', get('SMTP_USER')),
    fromName: get('MAIL_FROM_NAME', 'Brand Image Website'),
    to: get('MAIL_TO').split(',').map((s) => s.trim()).filter(Boolean),
    captchaSecret: get('RECAPTCHA_SECRET'),
  };
}

/* ---------------------------------------------------------------- the request */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** The form's fields, from multipart/form-data (what the page's fetch sends) or a plain form post. */
function parseFields(req, body) {
  const type = req.headers['content-type'] || '';
  const fields = {};
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(type);
  if (/multipart\/form-data/i.test(type) && boundary) {
    const mark = `--${boundary[1] || boundary[2]}`;
    for (const part of body.toString('utf8').split(mark)) {
      const at = part.indexOf('\r\n\r\n');
      if (at < 0) continue;
      const name = /name="([^"]*)"/i.exec(part.slice(0, at));
      if (!name || /filename=/i.test(part.slice(0, at))) continue;
      fields[name[1]] = part.slice(at + 4).replace(/\r\n$/, '');
    }
  } else {
    for (const [key, value] of new URLSearchParams(body.toString('utf8'))) fields[key] = value;
  }
  return fields;
}

const textLength = (value) => [...value].length;
const oneLine = (value) => String(value || '').replace(/[\x00-\x1F\x7F]+/g, ' ').trim();
const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function respond(res, wantsJson, status, ok, message) {
  if (wantsJson) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok, message }));
    return;
  }
  const title = ok ? 'Enquiry submitted' : 'Enquiry not sent';
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Brand Image Media Pvt Ltd</title></head>`
    + '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#2B2A28">'
    + `<h1 style="color:#2468B1">${title}</h1><p>${escapeHtml(message)}</p><p><a href="contact.html" style="color:#2468B1">Back to the Contact page</a></p></body></html>`);
}

async function handleEnquiry(req, res, projectDir) {
  const wantsJson = /application\/json/i.test(req.headers.accept || '');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, wantsJson, 405, false, 'Please send your enquiry from the Contact page.');
  }
  // only from this website's own pages
  const host = String(req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
  const origin = req.headers.origin || '';
  if (origin) {
    let originHost = '';
    try { originHost = new URL(origin).hostname.toLowerCase(); } catch (e) { /* not a URL */ }
    if (originHost.replace(/^\[|\]$/g, '') !== host.replace(/^\[|\]$/g, '')) return respond(res, wantsJson, 403, false, 'Please send your enquiry from the Contact page.');
  }
  let fields;
  try { fields = parseFields(req, await readBody(req)); } catch (e) { return respond(res, wantsJson, 413, false, 'Please check the highlighted fields and try again.'); }

  // the hidden field (_hp) is left empty by people and filled in by spam robots: pretend it worked
  if (String(fields._hp || '').trim() !== '') return respond(res, wantsJson, 200, true, 'Your enquiry has been successfully submitted.');

  // the same checks as the form (src/scripts/main.js) and send-enquiry.php
  const name = oneLine(fields.name);
  const email = oneLine(fields.email);
  const phone = oneLine(fields.phone);
  const service = oneLine(fields.service);
  const message = String(fields.message || '').replace(/\r\n?/g, '\n').trim();
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1);
  const valid = textLength(name) >= 2 && textLength(name) <= 50 && !/\d/.test(name)
    && email.length >= 6 && email.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    && phone.length >= 10 && phone.length <= 16 && /^\+?[\d\s()-]+$/.test(phone) && /^[6-9]\d{9}$/.test(digits)
    && service !== '' && textLength(service) <= 100
    && textLength(message) >= 10 && textLength(message) <= 1000;
  if (!valid) return respond(res, wantsJson, 422, false, 'Please check the highlighted fields and try again.');

  const smtp = settings(projectDir);

  // Google reCAPTCHA ("I'm not a robot"), when RECAPTCHA_SECRET is set in .env: the tick sent with the
  // form is checked with Google, as send-enquiry.php does; without a valid tick nothing is sent
  if (smtp.captchaSecret) {
    const token = String(fields['g-recaptcha-response'] || '').trim();
    let passed = false;
    if (token) {
      try {
        const answer = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          body: new URLSearchParams({ secret: smtp.captchaSecret, response: token, remoteip: req.socket.remoteAddress || '' }),
          signal: AbortSignal.timeout(10000),
        }).then((r) => r.json());
        passed = Boolean(answer && answer.success);
        if (!passed) console.error(`  Contact form: reCAPTCHA not passed (${JSON.stringify(answer['error-codes'] || [])})`);
      } catch (e) {
        console.error(`  Contact form: reCAPTCHA could not be checked (${e.message})`);
      }
    }
    if (!passed) return respond(res, wantsJson, 403, false, 'Please tick "I\'m not a robot" and try again.');
  }

  if (!smtp.host || !smtp.from || !smtp.to.length) {
    console.error('  Contact form: SMTP_HOST, MAIL_FROM / SMTP_USER or MAIL_TO is missing from .env');
    return respond(res, wantsJson, 500, false, 'Sorry, enquiries cannot be sent right now.');
  }

  // the email: the design in site/lib/enquiry-email.html (shared with send-enquiry.php), filled in with the
  // enquiry made safe for HTML, and a plain-text copy for mail apps that show text only
  const fill = {
    name: escapeHtml(name),
    first_name: escapeHtml(name.split(' ')[0]),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    tel: escapeHtml(`+91${digits}`),
    service: escapeHtml(service),
    message: escapeHtml(message).replace(/\n/g, '<br>\n'),
    reply_subject: escapeHtml(encodeURIComponent(`Re: Website enquiry: ${service}`)),
  };
  const text = `New enquiry from the website\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nMessage:\n${message}\n`;
  let template = '';
  try { template = fs.readFileSync(path.join(projectDir, 'site', 'lib', 'enquiry-email.html'), 'utf8'); } catch (e) { /* the plain layout below */ }
  const html = template
    ? template.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in fill ? fill[key] : ''))
    : `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2B2A28">${escapeHtml(text).replace(/\n/g, '<br>\n')}</p>`;

  try {
    await sendMail(smtp, { replyTo: { name, email }, subject: `Website enquiry: ${service} - ${name}`, html, text });
  } catch (e) {
    console.error(`  Contact form: the enquiry could not be emailed (${e.message})`);
    return respond(res, wantsJson, 502, false, 'Sorry, your enquiry could not be sent.');
  }
  console.log(`  Contact form: enquiry from ${name} emailed to ${smtp.to.join(', ')}`);
  return respond(res, wantsJson, 200, true, 'Your enquiry has been successfully submitted.');
}

/* ---------------------------------------------------------------- the email */
const b64 = (value) => Buffer.from(value, 'utf8').toString('base64');
const wrap76 = (value) => value.replace(/.{1,76}/g, '$&\r\n');
const header = (value) => (/^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`);
const address = (name, email) => (name ? `"${header(name).replace(/"/g, '')}" <${email}>` : `<${email}>`);

function buildMessage(smtp, mail) {
  const boundary = `=_bi_${crypto.randomBytes(12).toString('hex')}`;
  const domain = (smtp.from.split('@')[1] || 'localhost').replace(/[^\w.-]/g, '');
  return [
    `From: ${address(smtp.fromName, smtp.from)}`,
    `To: ${smtp.to.map((to) => `<${to}>`).join(', ')}`,
    `Reply-To: ${address(mail.replyTo.name, mail.replyTo.email)}`,
    `Subject: ${header(mail.subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomBytes(16).toString('hex')}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(mail.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(mail.html)),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/* ---------------------------------------------------------------- SMTP */
/** A small SMTP conversation: replies are read whole (multi-line replies end with "NNN text"). */
function smtpSession(socket) {
  let buffer = '';
  let waiting = null;
  const replies = [];
  const take = () => {
    const lines = buffer.split('\r\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const reply = lines.slice(0, i + 1);
        buffer = lines.slice(i + 1).join('\r\n');
        return { code: Number(lines[i].slice(0, 3)), text: reply.join('\n') };
      }
    }
    return null;
  };
  const onData = (chunk) => {
    buffer += chunk.toString('utf8');
    let reply;
    while ((reply = take())) { if (waiting) { const w = waiting; waiting = null; w.resolve(reply); } else replies.push(reply); }
  };
  const onEnd = (err) => { if (waiting) { const w = waiting; waiting = null; w.reject(err || new Error('the connection was closed')); } };
  socket.on('data', onData);
  socket.on('error', onEnd);
  socket.on('close', () => onEnd());
  const read = () => (replies.length ? Promise.resolve(replies.shift()) : new Promise((resolve, reject) => { waiting = { resolve, reject }; }));
  const command = async (line, expect, label) => {
    if (line !== null) socket.write(`${line}\r\n`);
    const reply = await read();
    if (!expect.includes(reply.code)) throw new Error(`${label || (line || 'greeting').split(' ')[0]} refused: ${reply.text.split('\n').pop().slice(0, 120)}`);
    return reply;
  };
  const detach = () => { socket.removeListener('data', onData); };
  return { command, detach };
}

function connect(smtp) {
  return new Promise((resolve, reject) => {
    const options = { host: smtp.host, port: smtp.port, servername: smtp.host };
    const socket = smtp.secure === 'ssl' ? tls.connect(options) : net.connect(options);
    socket.setTimeout(20000, () => socket.destroy(new Error('the mail server did not answer in time')));
    socket.once(smtp.secure === 'ssl' ? 'secureConnect' : 'connect', () => resolve(socket));
    socket.once('error', reject);
  });
}

/** Connect, greet, switch to TLS when asked (587), log in. Returns the session and socket. */
async function openSession(smtp) {
  let socket = await connect(smtp);
  let session = smtpSession(socket);
  const hello = `EHLO ${os.hostname().replace(/[^\w.-]/g, '') || 'localhost'}`;
  await session.command(null, [220]);
  let ehlo = await session.command(hello, [250]);
  if (smtp.secure === 'tls') {
    if (!/STARTTLS/i.test(ehlo.text)) throw new Error('the mail server does not offer STARTTLS');
    await session.command('STARTTLS', [220]);
    session.detach();
    socket = await new Promise((resolve, reject) => {
      const secure = tls.connect({ socket, servername: smtp.host }, () => resolve(secure));
      secure.once('error', reject);
    });
    socket.setTimeout(20000, () => socket.destroy(new Error('the mail server did not answer in time')));
    session = smtpSession(socket);
    ehlo = await session.command(hello, [250]);
  }
  if (smtp.user) {
    if (/AUTH[ =][^\n]*PLAIN/i.test(ehlo.text)) {
      await session.command(`AUTH PLAIN ${Buffer.from(`\0${smtp.user}\0${smtp.pass}`, 'utf8').toString('base64')}`, [235], 'login');
    } else {
      await session.command('AUTH LOGIN', [334], 'login');
      await session.command(Buffer.from(smtp.user, 'utf8').toString('base64'), [334], 'login');
      await session.command(Buffer.from(smtp.pass, 'utf8').toString('base64'), [235], 'login');
    }
  }
  return { session, socket };
}

async function sendMail(smtp, mail) {
  const { session, socket } = await openSession(smtp);
  try {
    await session.command(`MAIL FROM:<${smtp.from}>`, [250]);
    for (const to of smtp.to) await session.command(`RCPT TO:<${to}>`, [250, 251]);
    await session.command('DATA', [354]);
    const data = buildMessage(smtp, mail).replace(/\r\n\./g, '\r\n..');
    await session.command(`${data}\r\n.`, [250], 'sending');
    await session.command('QUIT', [221]).catch(() => {});
  } finally {
    socket.end();
  }
}

/** Log in and leave again (nothing is sent): tells whether the .env settings work. */
async function checkSmtp(projectDir) {
  const smtp = settings(projectDir);
  if (!smtp.host) throw new Error('SMTP_HOST is missing from .env');
  const { session, socket } = await openSession(smtp);
  try { await session.command('QUIT', [221]).catch(() => {}); } finally { socket.end(); }
  return { host: smtp.host, port: smtp.port, secure: smtp.secure, receivers: smtp.to.length };
}

module.exports = { handleEnquiry, checkSmtp, buildMessage, settings };
