
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FILE
// This file is used to initialize the Firebase Admin SDK.
// It is expected to be used in server-side code only.

export async function initializeAdminApp(): Promise<App> {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const response = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/firebase-adminsdk-h1y33@' +
      'studio-6452441904-ae7c4.iam.gserviceaccount.com'
  );
  const serviceAccount = await response.json();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}
