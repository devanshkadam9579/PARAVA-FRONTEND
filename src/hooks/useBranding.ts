import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export interface BrandingConfig {
  logoUrl: string;
  logoAltText: string;
  logoDarkUrl?: string;
  logoUpdatedAt?: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: 'https://res.cloudinary.com/k03rmhkg/image/upload/v1792254596/parva_branding/myparva_official_logo.png',
  logoAltText: 'myparva.com'
};

const STORAGE_KEY = 'parva_branding_cache';

export function useBranding(): BrandingConfig {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (_) {}
    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    const db = getDb();
    if (!db) return;

    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.logoUrl) {
          const updated: BrandingConfig = {
            logoUrl: data.logoUrl,
            logoAltText: data.logoAltText || 'Parva Celebrations',
            logoDarkUrl: data.logoDarkUrl,
            logoUpdatedAt: data.logoUpdatedAt
          };
          setBranding(updated);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            if (typeof document !== 'undefined') {
              const icons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
              icons.forEach((el) => {
                (el as HTMLLinkElement).href = data.logoUrl;
              });
            }
          } catch (_) {}
        }
      }
    }, (err) => {
      console.warn('[Branding] Realtime listener notice:', err.message);
    });

    return unsub;
  }, []);

  return branding;
}
