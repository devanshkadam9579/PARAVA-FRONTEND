import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { PaymentSettings } from '../types';

export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  const docRef = doc(getDb(), 'settings', 'payment');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as PaymentSettings;
  }
  // Default if not set
  return { id: 'payment', paymentEnabled: true, methods: ['upi', 'card'] };
};

export const updatePaymentSettings = async (settings: PaymentSettings) => {
  const docRef = doc(getDb(), 'settings', 'payment');
  await setDoc(docRef, settings, { merge: true });
};
