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
