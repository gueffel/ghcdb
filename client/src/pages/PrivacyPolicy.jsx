import React from 'react';

function Section({ title, children }) {
  return (
    <div className="settings-card">
      <h2 className="settings-section-title">{title}</h2>
      <div style={{ color: 'var(--text-muted)', lineHeight: 1.75, fontSize: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="page page-narrow">
      <h1 className="page-title">Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, marginTop: -16 }}>Last updated: July 2026</p>

      <div className="settings-stack">
        <Section title="What we collect">
          <p>When you create an account we collect your <strong style={{ color: 'var(--text)' }}>email address</strong> and optionally your <strong style={{ color: 'var(--text)' }}>first and last name</strong>. If you sign in with Google or Discord we receive the email address associated with that account.</p>
          <p>The <strong style={{ color: 'var(--text)' }}>card collection data</strong> you enter (card details, ownership status, wishlist, etc.) is stored and associated with your account so we can provide the service.</p>
          <p>We do not collect payment information directly. If you subscribe to a paid plan in the future, payments are processed by a third-party provider and we only store a subscription status and expiry date.</p>
        </Section>

        <Section title="How we use it">
          <p>Your data is used solely to operate GHCdb — authenticating you, storing your collection, and displaying your stats. We do not sell your data, share it with advertisers, or use it for any purpose other than running the app.</p>
        </Section>

        <Section title="Cookies & tracking">
          <p>We use a single session cookie set by our authentication provider (Supabase) to keep you signed in. This cookie is strictly necessary for the app to function and does not track you across other websites.</p>
          <p>We do not use any analytics, advertising, or tracking cookies. There are no third-party pixels or scripts on this site.</p>
        </Section>

        <Section title="Email communications">
          <p>We send transactional emails only — a welcome email when you register, and a password reset email when you request one. We do not send marketing emails.</p>
          <p>Emails are sent via <strong style={{ color: 'var(--text)' }}>Resend</strong>. Your email address is passed to Resend for the purpose of delivery only.</p>
        </Section>

        <Section title="Data storage & security">
          <p>Your account and collection data is stored in a <strong style={{ color: 'var(--text)' }}>Supabase</strong> database. Supabase is SOC 2 Type II certified and stores data in secure, encrypted databases. The app is hosted on <strong style={{ color: 'var(--text)' }}>Netlify</strong>.</p>
          <p>We take reasonable steps to protect your data, but no internet service can guarantee absolute security. Please use a strong, unique password.</p>
        </Section>

        <Section title="Data retention">
          <p>We keep your data for as long as your account is active. If you would like your account and all associated data deleted, contact us at <a href="mailto:hi@ghcdb.ca" style={{ color: 'var(--accent)' }}>hi@ghcdb.ca</a> and we will delete it promptly.</p>
        </Section>

        <Section title="Your rights">
          <p>Regardless of where you are located, you have the right to:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Access the data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your collection data (use the Export feature in the app)</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:hi@ghcdb.ca" style={{ color: 'var(--accent)' }}>hi@ghcdb.ca</a>.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>If we make material changes to this policy we will update the date at the top of this page. Continued use of GHCdb after changes are posted means you accept the updated policy.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about this policy? Reach us at <a href="mailto:hi@ghcdb.ca" style={{ color: 'var(--accent)' }}>hi@ghcdb.ca</a>.</p>
        </Section>
      </div>
    </div>
  );
}
