/**
 * Email Notification Service
 * 
 * STUB - Ready for integration with Resend or SendGrid
 * 
 * Future triggers:
 * - Domain added to watchlist drops (becomes available)
 * - Domain approaching drop date (7 days, 3 days, 1 day)
 * - Weekly digest of favorited domains
 */

// TODO: Add to .env when implementing
// EMAIL_PROVIDER=resend (or sendgrid)
// EMAIL_API_KEY=your-api-key
// EMAIL_FROM=alerts@opportunityexchange.com

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'alerts@opportunityexchange.com';

/**
 * Send an email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (fallback)
 */
async function sendEmail({ to, subject, html, text }) {
  if (!EMAIL_PROVIDER || !EMAIL_API_KEY) {
    console.log('[EMAIL STUB] Would send email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text?.substring(0, 100)}...`);
    return { sent: false, reason: 'Email not configured' };
  }

  // TODO: Implement actual sending with Resend or SendGrid
  // 
  // if (EMAIL_PROVIDER === 'resend') {
  //   const { Resend } = require('resend');
  //   const resend = new Resend(EMAIL_API_KEY);
  //   return await resend.emails.send({ from: EMAIL_FROM, to, subject, html, text });
  // }
  //
  // if (EMAIL_PROVIDER === 'sendgrid') {
  //   const sgMail = require('@sendgrid/mail');
  //   sgMail.setApiKey(EMAIL_API_KEY);
  //   return await sgMail.send({ from: EMAIL_FROM, to, subject, html, text });
  // }

  console.warn(`Unknown email provider: ${EMAIL_PROVIDER}`);
  return { sent: false, reason: 'Unknown provider' };
}

/**
 * Notify user that a domain they're watching has dropped
 */
async function notifyDomainDropped({ userEmail, domain, registrarLinks }) {
  const subject = `🎯 Domain Available: ${domain.domain}`;
  
  const html = `
    <h2>Good news!</h2>
    <p>The domain <strong>${domain.domain}</strong> that you were watching is now available for registration.</p>
    
    <h3>Domain Details</h3>
    <ul>
      <li>Score: ${domain.score}</li>
      <li>Backlinks: ${domain.backlinks}</li>
      <li>Trust Flow: ${domain.majestic_tf}</li>
    </ul>
    
    <h3>Register Now</h3>
    <p>Act fast - good domains get picked up quickly!</p>
    <ul>
      ${registrarLinks.map(r => `<li><a href="${r.url}">${r.name}</a></li>`).join('')}
    </ul>
    
    <p style="color: #666; font-size: 12px;">
      You received this because you added ${domain.domain} to your watchlist on Opportunity Exchange.
    </p>
  `;
  
  const text = `Domain Available: ${domain.domain}\n\nThe domain you were watching is now available for registration.\n\nScore: ${domain.score}\nBacklinks: ${domain.backlinks}\n\nAct fast!`;

  return sendEmail({ to: userEmail, subject, html, text });
}

/**
 * Notify user that a domain they're watching is approaching drop date
 */
async function notifyApproachingDrop({ userEmail, domain, daysRemaining }) {
  const subject = `⏰ ${daysRemaining} days until ${domain.domain} drops`;
  
  const html = `
    <h2>Domain Dropping Soon</h2>
    <p><strong>${domain.domain}</strong> will be deleted in <strong>${daysRemaining} days</strong>.</p>
    
    <h3>Domain Details</h3>
    <ul>
      <li>Score: ${domain.score}</li>
      <li>Drop Date: ${domain.delete_date}</li>
      <li>Why interesting: ${domain.why_interesting || 'N/A'}</li>
    </ul>
    
    <p>Set up a backorder or be ready to register when it drops!</p>
  `;
  
  const text = `${domain.domain} drops in ${daysRemaining} days\n\nBe ready to register when it becomes available.`;

  return sendEmail({ to: userEmail, subject, html, text });
}

/**
 * Check if email notifications are configured
 */
function isConfigured() {
  return !!(EMAIL_PROVIDER && EMAIL_API_KEY);
}

module.exports = {
  sendEmail,
  notifyDomainDropped,
  notifyApproachingDrop,
  isConfigured,
};
