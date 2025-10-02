
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

  // This is a simplified service account object for server-side authentication.
  // In a real production environment, you would use a more secure method
  // like environment variables or a secret manager to store credentials.
  const serviceAccount = {
    projectId: firebaseConfig.projectId,
    // The client_email and private_key are not needed for this simplified setup
    // as App Hosting provides them securely in the environment.
    // However, the `cert` function expects these fields to exist.
    client_email: `firebase-adminsdk-h1y33@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
    private_key: '-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----\n',
  };

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}
