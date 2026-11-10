import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Drive uses a dedicated Firebase app/auth instance so connecting or
// disconnecting Drive never changes the owner/employee session.
const DRIVE_APP_NAME = 'boutiquepro-drive';
const driveApp = getApps().some((item) => item.name === DRIVE_APP_NAME)
  ? getApp(DRIVE_APP_NAME)
  : initializeApp(firebaseConfig, DRIVE_APP_NAME);
export const auth = getAuth(driveApp);

// Google Drive file scope for backup & restore.
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => onAuthStateChanged(auth, (user: User | null) => {
  if (user && cachedAccessToken) {
    onAuthSuccess?.(user, cachedAccessToken);
  } else {
    if (!user) cachedAccessToken = null;
    if (!isSigningIn) onAuthFailure?.();
  }
});

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible de récupérer le token Google Drive');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Drive Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
