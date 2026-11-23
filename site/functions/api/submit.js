/**
 * Cloudflare Pages Function: POST /api/submit
 *
 * Delivers Foam Battle Parties form requests through Resend.
 * From: Foam Battle Parties <leads@newleadrelay.com>
 * To: joshuaenglish72@gmail.com only. The request body is never used
 * for to, cc, bcc, or from.
 *
 * Env: RESEND_API_KEY (secret, production). If the key is missing or
 * the send fails, this returns an error so the front end does not show
 * success. No thank-you redirect.
 */

const MAIL_TO = 'joshuaenglish72@gmail.com';
const MAIL_FROM = 'Foam Battle Parties <leads@newleadrelay.com>';

const ALLOWED_ORIGINS = new Set([
  'https://foambattleparties.com',
  'https://www.foambattleparties.com',
]);

const FIELD_LABELS = {
  name: 'Full Name',
  phone: 'Phone',
  email: 'Email',
  contact_method: 'Preferred Contact Method',
  party_type: 'Party Type',
  event_date: 'Event Date',
  participants: 'Participants',
  kids: 'Number of Kids',
  event_location: 'Event City or Address',
  message: 'Message',
  page: 'Page',
};

const IGNORED = new Set([
  'to',
  'cc',
  'bcc',
  'from',
  'recipient',
  'recipients',
  'mail_to',
  'mail_from',
  'reply_to',
]);

const MAX_LEN = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function originAllowed(request) {
  const origin = request.headers.get('Origin');
  if (origin) return ALLOWED_ORIGINS.has(origin);
  const referer = request.headers.get('Referer') || '';
  try {
    return ALLOWED_ORIGINS.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  const data = {};
  if (type.includes('application/json')) {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('invalid');
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' || typeof value === 'number') data[key] = String(value);
    }
    return data;
  }
  const form = await request.formData();
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') data[key] = value;
  }
  return data;
}

function trimField(value) {
  return String(value || '').trim().slice(0, MAX_LEN);
}

function buildEmail(data) {
  const name = trimField(data.name) || 'no name';
  const subject = 'New party request from ' + name;
  const rows = Object.keys(FIELD_LABELS)
    .filter((key) => trimField(data[key]) !== '')
    .map((key) => {
      const val = escapeHtml(trimField(data[key])).replace(/\n/g, '<br>');
      return (
        '<tr>' +
        '<td style="padding:6px 14px 6px 0;color:#5a6578;font:13px/1.5 Helvetica,Arial,sans-serif;white-space:nowrap;vertical-align:top">' +
        escapeHtml(FIELD_LABELS[key]) +
        '</td>' +
        '<td style="padding:6px 0;color:#182B49;font:14px/1.5 Helvetica,Arial,sans-serif">' +
        val +
        '</td></tr>'
      );
    })
    .join('');
  const text = Object.keys(FIELD_LABELS)
    .filter((key) => trimField(data[key]) !== '')
    .map((key) => FIELD_LABELS[key] + ': ' + trimField(data[key]))
    .join('\n');
  const html =
    '<div style="background:#F3F4F6;padding:24px">' +
    '<h1 style="font:700 20px/1.3 Helvetica,Arial,sans-serif;color:#182B49;margin:0 0 16px">New party request</h1>' +
    '<table cellpadding="0" cellspacing="0">' +
    rows +
    '</table></div>';
  return { subject, html, text };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!originAllowed(request)) {
    return json(403, { error: 'forbidden' });
  }

  let data;
  try {
    data = await readBody(request);
  } catch {
    return json(400, { error: 'invalid_body' });
  }

  for (const key of IGNORED) delete data[key];

  const name = trimField(data.name);
  const email = trimField(data.email);
  const phone = trimField(data.phone);
  if (!name || !phone) return json(400, { error: 'missing_fields' });
  if (email && !EMAIL_RE.test(email)) return json(400, { error: 'invalid_email' });

  if (!env.RESEND_API_KEY) {
    return json(503, { error: 'email_not_configured' });
  }

  const { subject, html, text } = buildEmail(data);
  const payload = {
    from: MAIL_FROM,
    to: [MAIL_TO],
    subject,
    html,
    text,
  };
  if (email) payload.reply_to = email;

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json(502, { error: 'send_failed' });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Resend error', res.status, detail);
    return json(502, { error: 'send_failed' });
  }

  return json(200, { ok: true });
}

export async function onRequestGet() {
  return json(405, { error: 'method_not_allowed' });
}

export async function onRequestOptions() {
  return json(405, { error: 'method_not_allowed' });
}
