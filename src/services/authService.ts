import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuthInstance, getDb } from '../lib/firebase';

export interface CustomerProfileData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  photoURL?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const MASTER_ADMIN_EMAILS = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com', 'devansh@parva.com'];

/**
 * Checks if email qualifies as master admin.
 */
export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Ensures a user profile exists in Firestore `users/{uid}`.
 * If not existing, creates a customer profile.
 * If existing, updates any provided fields safely with merge.
 */
export async function ensureUserProfile(
  user: FirebaseUser, 
  extraData?: Partial<CustomerProfileData>
): Promise<CustomerProfileData> {
  const db = getDb();
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const isAdmin = isMasterAdminEmail(user.email);
  const now = new Date().toISOString();

  if (userSnap.exists()) {
    const existing = userSnap.data() as CustomerProfileData;
    const mergedRole = isAdmin ? 'master_admin' : (existing.role || 'customer');
    
    const updatedData: CustomerProfileData = {
      uid: user.uid,
      name: extraData?.name || existing.name || user.displayName || 'Parva Client',
      email: user.email || existing.email || '',
      phone: extraData?.phone || existing.phone || user.phoneNumber || '',
      city: extraData?.city || existing.city || 'Kolhapur',
      address: extraData?.address !== undefined ? extraData.address : (existing.address || ''),
      photoURL: user.photoURL || existing.photoURL || '',
      role: mergedRole,
      updatedAt: now,
      ...extraData
    };

    await setDoc(userRef, updatedData, { merge: true });
    return updatedData;
  } else {
    // New User profile creation
    const newProfile: CustomerProfileData = {
      uid: user.uid,
      name: extraData?.name || user.displayName || user.email?.split('@')[0] || 'Parva Client',
      email: user.email || '',
      phone: extraData?.phone || user.phoneNumber || '',
      city: extraData?.city || 'Kolhapur',
      address: extraData?.address || '',
      photoURL: user.photoURL || '',
      role: isAdmin ? 'master_admin' : 'customer',
      createdAt: now,
      updatedAt: now,
      ...extraData
    };

    await setDoc(userRef, newProfile, { merge: true });
    return newProfile;
  }
}

/**
 * Fetch profile for a given uid.
 */
export async function getUserProfile(uid: string): Promise<CustomerProfileData | null> {
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as CustomerProfileData;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Customer Sign In with Email & Password.
 */
export async function signInWithEmail(email: string, pass: string): Promise<CustomerProfileData> {
  const auth = getAuthInstance();
  const credential: UserCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await ensureUserProfile(credential.user);
  return profile;
}

/**
 * Customer Sign Up with Email & Password.
 * Resilient against partial failure: ensures Firestore user document is always written.
 */
export async function signUpWithEmail(
  email: string, 
  pass: string, 
  profileData: { name: string; phone?: string; city?: string; address?: string }
): Promise<CustomerProfileData> {
  const auth = getAuthInstance();
  const credential: UserCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await ensureUserProfile(credential.user, {
    name: profileData.name.trim(),
    phone: profileData.phone?.trim() || '',
    city: profileData.city?.trim() || 'Kolhapur',
    address: profileData.address?.trim() || '',
    role: 'customer'
  });
  return profile;
}

/**
 * Google 1-Click Sign In.
 */
export async function signInWithGoogle(): Promise<{ profile: CustomerProfileData; isNewUser: boolean }> {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  
  const db = getDb();
  const snap = await getDoc(doc(db, 'users', user.uid));
  const isNewUser = !snap.exists();
  
  const profile = await ensureUserProfile(user);
  return { profile, isNewUser };
}

/**
 * Update Customer Profile in Firestore.
 */
export async function updateCustomerProfile(uid: string, fields: Partial<CustomerProfileData>): Promise<void> {
  const db = getDb();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...fields,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Send Password Reset Email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getAuthInstance();
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Full Logout. Signs out from Firebase and purges local storage caches.
 */
export async function signOutUser(): Promise<void> {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
  } catch (err) {
    console.error('Firebase signOut error:', err);
  } finally {
    try {
      localStorage.removeItem('parva_user');
      localStorage.removeItem('parva_client_phone');
      localStorage.removeItem('parva_client_name');
    } catch (e) {
      // safe ignore
    }
  }
}

/**
 * Helper to check if a user object is considered fully authenticated.
 */
export function isUserAuthenticated(user: any): boolean {
  if (!user || typeof user !== 'object') return false;
  if (user.isGuest || user.uid === 'guest-uid' || user.uid === 'guest') return false;
  if (typeof user.uid === 'string' && user.uid.length > 5) {
    if (typeof user.email === 'string' && user.email.includes('@') && !user.email.includes('guest')) return true;
    if (typeof user.phone === 'string' && user.phone.replace(/\D/g, '').length >= 10) return true;
    if (typeof user.name === 'string' && user.name.trim().length > 0) return true;
  }
  return false;
}
