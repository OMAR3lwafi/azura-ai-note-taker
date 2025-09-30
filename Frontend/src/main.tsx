import { createRoot } from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry for error tracking and performance monitoring
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
}

// Simple error fallback component
function ErrorFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1>Oops! Something went wrong</h1>
      <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);