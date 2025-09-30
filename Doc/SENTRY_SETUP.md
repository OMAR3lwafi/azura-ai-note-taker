# Sentry Integration Guide

## Overview
Sentry provides error tracking and performance monitoring for both frontend and backend.

**Organization:** waqietv
**Dashboard:** https://waqietv.sentry.io

## Projects

### Frontend Project
- **Name:** azora-ai-notetaker-frontend
- **Platform:** React
- **DSN:** (to be created)

### Backend Project
- **Name:** azora-ai-notetaker-backend
- **Platform:** Node/Deno
- **DSN:** (to be created)

## Setup Instructions

### 1. Create Sentry Projects

```bash
# Login to Sentry
open https://waqietv.sentry.io

# Create frontend project
# - Go to Settings > Projects
# - Click "Create Project"
# - Select "React" platform
# - Name: "azora-ai-notetaker-frontend"
# - Team: "waqietv"

# Create backend project
# - Click "Create Project" again
# - Select "Node" platform
# - Name: "azora-ai-notetaker-backend"
# - Team: "waqietv"
```

### 2. Install SDKs

**Frontend:**
```bash
cd Frontend
npm install @sentry/react
```

**Backend:**
```typescript
// In supabase/functions/_shared/sentry.ts
import * as Sentry from 'https://deno.land/x/sentry/index.mjs';
```

### 3. Configure Environment Variables

**Frontend (.env):**
```bash
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

**Backend (Supabase Secrets):**
```bash
supabase secrets set SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
```

### 4. Initialize Sentry

**Frontend (main.tsx):**
See implementation in `Frontend/src/main.tsx`

**Backend (_shared/sentry.ts):**
See implementation in `supabase/functions/_shared/sentry.ts`

## Features Enabled

### Error Tracking
- Automatic error capture
- Stack traces with source maps
- User context (ID, email)
- Breadcrumbs for debugging
- Custom error context

### Performance Monitoring
- Transaction tracking
- API endpoint performance
- Database query performance
- Frontend component render times

### Session Replay (Frontend Only)
- Record user sessions
- Replay errors with full context
- Privacy controls (mask sensitive data)

## Usage Examples

### Frontend

```typescript
import * as Sentry from '@sentry/react';

// Capture exception
try {
  // code
} catch (error) {
  Sentry.captureException(error);
}

// Add breadcrumb
Sentry.addBreadcrumb({
  message: 'User clicked button',
  category: 'ui',
  level: 'info',
});

// Set user context
Sentry.setUser({
  id: userId,
  email: userEmail,
});
```

### Backend

```typescript
import { captureException, addBreadcrumb } from '../_shared/sentry.ts';

try {
  // API logic
} catch (error) {
  captureException(error, {
    userId,
    endpoint: '/v1/meetings',
    method: 'POST',
  });
  throw error;
}
```

## Source Maps

### Frontend
Vite automatically generates source maps in production. Configure upload:

```typescript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: 'waqietv',
      project: 'azora-ai-notetaker-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### Backend
Deno source maps are handled automatically.

## Alerts & Notifications

### Configure Alerts
1. Go to Alerts > Create Alert
2. Set conditions:
   - Error rate > 10 per minute
   - New issue detected
   - Performance degradation
3. Set notification channels:
   - Email
   - Slack (optional)
   - Linear (optional)

### Integration with Linear
Connect Sentry to Linear to auto-create issues:
1. Go to Settings > Integrations
2. Search for "Linear"
3. Connect and configure
4. New errors will create Linear issues

## Best Practices

### 1. Filter Sensitive Data
```typescript
beforeSend(event) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
  }
  return event;
}
```

### 2. Sample Rates
- Production: 100% errors, 10% performance
- Development: 100% errors, 100% performance

### 3. Release Tracking
Tag releases for better tracking:
```typescript
Sentry.init({
  release: 'azora@1.0.0',
  environment: 'production',
});
```

### 4. User Feedback
Enable user feedback widget:
```typescript
Sentry.showReportDialog({
  eventId: lastEventId,
});
```

## Monitoring Checklist

- [ ] Frontend project created
- [ ] Backend project created
- [ ] DSNs configured in environment
- [ ] SDKs installed and initialized
- [ ] Source maps uploading
- [ ] Alerts configured
- [ ] Team notifications set up
- [ ] Linear integration connected
- [ ] Test error tracking working
- [ ] Performance monitoring enabled

## Troubleshooting

### Errors Not Appearing
1. Check DSN is correct
2. Verify environment is production
3. Check network requests in DevTools
4. Ensure `beforeSend` isn't filtering too much

### Source Maps Not Working
1. Verify source maps are generated
2. Check auth token is valid
3. Ensure release matches
4. Upload manually if needed

### Performance Data Missing
1. Check `tracesSampleRate` is > 0
2. Verify transactions are being created
3. Check network for performance data

## Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Deno Docs](https://docs.sentry.io/platforms/javascript/guides/deno/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

**Status:** Setup in progress
**Next Steps:** Create projects and get DSNs
