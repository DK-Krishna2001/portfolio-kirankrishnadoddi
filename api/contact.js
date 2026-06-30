import { Resend } from 'resend';

const MAX_LENGTH = {
  name: 100,
  email: 254,
  subject: 150,
  message: 5000
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function validate({ name, email, subject, message }) {
  const errors = {};

  if (!name) errors.name = 'Please enter your name.';
  if (!email || !EMAIL_PATTERN.test(email)) errors.email = 'Please enter a valid email address.';
  if (!subject) errors.subject = 'Please enter a subject.';
  if (!message) errors.message = 'Please enter your message.';

  Object.entries({ name, email, subject, message }).forEach(([field, value]) => {
    if (value && value.length > MAX_LENGTH[field]) {
      errors[field] = `Please keep ${field} under ${MAX_LENGTH[field]} characters.`;
    }
  });

  return errors;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { ok: false, error: 'Invalid request body.' });
  }

  const honeypot = clean(body.company);
  if (honeypot) {
    return json(res, 200, { ok: true });
  }

  const submission = {
    name: clean(body.name),
    email: clean(body.email),
    subject: clean(body.subject),
    message: clean(body.message)
  };

  const errors = validate(submission);
  if (Object.keys(errors).length > 0) {
    return json(res, 400, { ok: false, error: 'Please check the highlighted fields.', errors });
  }

  if (!process.env.RESEND_API_KEY) {
    return json(res, 500, { ok: false, error: 'Email service is not configured.' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.CONTACT_TO_EMAIL || 'rvkkdoddi2001@gmail.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <contact@kirank.tech>';
  const safe = {
    name: escapeHtml(submission.name),
    email: escapeHtml(submission.email),
    subject: escapeHtml(submission.subject),
    message: escapeHtml(submission.message).replace(/\n/g, '<br>')
  };

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: submission.email,
      subject: `Portfolio contact: ${submission.subject}`,
      text: [
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Subject: ${submission.subject}`,
        '',
        submission.message
      ].join('\n'),
      html: `
        <h2>New portfolio contact message</h2>
        <p><strong>Name:</strong> ${safe.name}</p>
        <p><strong>Email:</strong> ${safe.email}</p>
        <p><strong>Subject:</strong> ${safe.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${safe.message}</p>
      `
    });

    if (error) {
      console.error('Resend email failed:', error);
      return json(res, 502, { ok: false, error: 'Message could not be sent right now. Please email me directly.' });
    }

    return json(res, 200, { ok: true, id: data?.id });
  } catch (error) {
    console.error('Contact email failed:', error);
    return json(res, 500, { ok: false, error: 'Message could not be sent right now. Please email me directly.' });
  }
}
