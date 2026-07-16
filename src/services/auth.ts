import { signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuthInstance, getDb } from '../lib/firebase';
import { User } from '../types';

const MASTER_ADMIN_EMAILS = ['devenshkadam2@gmail.com', 'devanshkadam2@gmail.com'];

export const loginAndAuthorize = async (email: string, pass: string): Promise<UserCredential> => {
  const auth = getAuthInstance();
  const db = getDb();
  
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Check if it's the master admin
  if (MASTER_ADMIN_EMAILS.includes(email)) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Ensure master admin role is set
    if (!userDoc.exists() || userDoc.data().role !== 'master_admin') {
      await setDoc(userDocRef, {
        email: email,
        name: 'Master Admin',
        role: 'master_admin',
        city: 'All'
      }, { merge: true });
    }
  }

  return userCredential;
};
