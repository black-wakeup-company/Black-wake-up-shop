import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Primary Firebase app: owner and employee authentication.
export const app = getApps().some((item) => item.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
