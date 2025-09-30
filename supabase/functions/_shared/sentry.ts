import * as Sentry from 'https://deno.land/x/sentry/index.mjs';

const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: 1.0,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error('Sentry not configured:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.log(`[${level}] ${message}`, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function setUser(userId: string, email?: string) {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email,
  });
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}
