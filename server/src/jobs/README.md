# Jobs Directory

This directory will contain scheduled background jobs.

## Planned Jobs

### domainRefresh.js (Future)
- Runs daily
- Re-checks DNS availability for watched/favorited domains
- Triggers WHOIS enrichment for domains dropping soon

### alertProcessor.js (Future)
- Checks for domains that have dropped
- Sends email notifications to watchers
- Requires email service integration (Resend/SendGrid)

## Implementation Notes

Will use node-cron for scheduling:
```javascript
const cron = require('node-cron');

// Run every day at 6 AM UTC
cron.schedule('0 6 * * *', () => {
  // Job logic
});
```
