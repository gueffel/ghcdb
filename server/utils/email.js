import { Resend } from 'resend';

function getClient() { return new Resend(process.env.RESEND_API_KEY); }
const FROM = () => process.env.EMAIL_FROM || 'GHCdb <noreply@yourdomain.com>';

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendAdminSignupNotification({ username, email }) {
  if (!process.env.ADMIN_EMAIL || !process.env.RESEND_API_KEY) return;
  await getClient().emails.send({
    from: FROM(),
    to: process.env.ADMIN_EMAIL,
    subject: 'New user registered — GHCdb',
    html: `<p>New user registered: <strong>${esc(username)}</strong>${email ? ` (${esc(email)})` : ''}</p>`,
  });
}

export async function sendWelcomeEmail({ username, email }) {
  if (!process.env.RESEND_API_KEY || !email) return;
  await getClient().emails.send({
    from: FROM(),
    to: email,
    subject: 'Welcome to GHCdb!',
    html: `<p>Hi ${esc(username)},</p><p>Your account has been created. You can now log in and start tracking your hockey card collection.</p>`,
  });
}

export async function sendPasswordResetEmail({ email, token }) {
  if (!process.env.RESEND_API_KEY) return;
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  await getClient().emails.send({
    from: FROM(),
    to: email,
    subject: 'Reset your GHCdb password',
    html: `<p>Click the link below to reset your password. The link is valid for 1 hour.</p><p><a href="${url}">${url}</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

export async function sendBugReportNotification({ username, email, title, bugId }) {
  if (!process.env.ADMIN_EMAIL || !process.env.RESEND_API_KEY) return;
  await getClient().emails.send({
    from: FROM(),
    to: process.env.ADMIN_EMAIL,
    subject: `New bug report from ${esc(username)} — GHCdb`,
    html: `<p>User <strong>${esc(username)}</strong>${email ? ` (${esc(email)})` : ''} submitted a bug report:</p><p><strong>${esc(title)}</strong></p><p>Bug #${bugId}</p>`,
  });
}

export async function sendBugReply({ to, username, title, message }) {
  if (!process.env.RESEND_API_KEY || !to) return;
  await getClient().emails.send({
    from: FROM(),
    to,
    subject: 'Reply to your bug report — GHCdb',
    html: `<p>Hi ${esc(username)},</p><p>An admin has replied to your bug report "<strong>${esc(title)}</strong>":</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
  });
}

export async function sendBugStatusUpdate({ to, username, title, status }) {
  if (!process.env.RESEND_API_KEY || !to) return;
  const label = status === 'fixed' ? 'marked as fixed' : 'closed';
  await getClient().emails.send({
    from: FROM(),
    to,
    subject: `Your bug report has been ${label} — GHCdb`,
    html: `<p>Hi ${esc(username)},</p><p>Your bug report "<strong>${esc(title)}</strong>" has been ${label}.</p>`,
  });
}
