
import { getApps, initializeApp, App } from 'firebase-admin/app';

// IMPORTANT: DO NOT MODIFY THIS FILE
// This file is used to initialize the Firebase Admin SDK.
// It is expected to be used in server-side code only.

export async function initializeAdminApp(): Promise<App> {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // By calling initializeApp without arguments, the SDK will automatically
  // use the GOOGLE_APPLICATION_CREDENTIALS environment variable or other
  // default credential discovery logic to find the service account credentials.
  // This is the recommended approach for environments like Cloud Run, Cloud Functions, and App Hosting.
  return initializeApp();
}
