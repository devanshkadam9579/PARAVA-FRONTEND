/**
 * PARVA Celebrations — Google Analytics 4 Utility
 * Measurement ID: G-23N3DXTTHZ
 * 
 * Lightweight, privacy-safe, resilient GA4 event dispatch.
 * Fails silently if blocked by ad-blocker or offline.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-23N3DXTTHZ';

// In-memory guard to prevent duplicate rapid events (e.g. React StrictMode double renders)
const eventDedupeCache = new Map<string, number>();
let lastTrackedPage = '';

/**
 * Filter out any Personally Identifiable Information (PII)
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> {
  if (!params) return {};
  const sanitized: Record<string, any> = {};
  
  const PII_KEYS = ['email', 'phone', 'mobile', 'address', 'password', 'token', 'secret', 'card', 'cvv'];
  
  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (PII_KEYS.some(pii => lowerKey.includes(pii))) {
      continue; // Omit PII entirely
    }
    if (typeof value === 'string' && value.length > 250) {
      sanitized[key] = value.substring(0, 250); // Prevent payload bloat
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Tracks a Single Page Application (SPA) View
 */
export function trackPageView(pageName: string, pageTitle?: string): void {
  try {
    if (!pageName || pageName === lastTrackedPage) return;
    lastTrackedPage = pageName;

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: pageTitle || ('PARVA | ' + pageName.charAt(0).toUpperCase() + pageName.slice(1)),
        page_location: window.location.href,
        page_path: '/' + pageName
      });
    }
  } catch (err) {
    // Fail silently without breaking the app
  }
}

/**
 * Core GA4 Event Tracker with Deduping & Privacy Safeguards
 */
export function trackEvent(eventName: string, params?: Record<string, any>, dedupeWindowMs = 600): void {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    const safeParams = sanitizeParams(params);
    const dedupeKey = eventName + '_' + JSON.stringify(safeParams);
    const now = Date.now();
    const lastTriggered = eventDedupeCache.get(dedupeKey);

    if (lastTriggered && (now - lastTriggered) < dedupeWindowMs) {
      return; // Skip duplicate rapid event
    }

    eventDedupeCache.set(dedupeKey, now);

    // Housekeep dedupe cache
    if (eventDedupeCache.size > 100) {
      for (const [k, time] of eventDedupeCache.entries()) {
        if (now - time > 10000) eventDedupeCache.delete(k);
      }
    }

    window.gtag('event', eventName, safeParams);
  } catch (err) {
    // Fail silently without impacting customer UX
  }
}


// ==================== SPECIFIC FUNNEL EVENT HELPERS ====================

export function trackLoginStarted(method = 'google'): void {
  trackEvent('login_started', { method });
}

export function trackLoginSuccess(method = 'google'): void {
  trackEvent('login_success', { method });
}

export function trackLoginFailed(method = 'google', reason?: string): void {
  trackEvent('login_failed', { method, reason: reason ? reason.substring(0, 100) : 'unknown' });
}

export function trackCategorySelected(category_name: string): void {
  trackEvent('category_selected', { category_name });
}

export function trackSearchPerformed(query: string, result_count: number, category?: string): void {
  if (!query || query.trim().length < 2) return;
  // Sanitize search query: omit if looks like phone/email
  if (query.includes('@') || /^\d{7,}$/.test(query.trim())) return;
  trackEvent('search_performed', {
    search_term: query.trim().toLowerCase(),
    result_count,
    selected_category: category || 'all'
  }, 1000);
}

export function trackFilterApplied(filters: {
  category?: string;
  min_price?: number | null;
  max_price?: number | null;
  guest_count?: number;
  filter_types?: string[];
  sort_mode?: string;
}): void {
  trackEvent('filter_applied', {
    category: filters.category || 'all',
    min_price: filters.min_price || 0,
    max_price: filters.max_price || 'any',
    guest_count: filters.guest_count || 100,
    filter_count: (filters.filter_types || []).length,
    sort_mode: filters.sort_mode || 'default'
  }, 1000);
}

export function trackVendorViewed(vendor: { id: string; name?: string; category?: string; location?: string }): void {
  trackEvent('vendor_viewed', {
    vendor_id: vendor.id,
    vendor_name: vendor.name || 'Vendor',
    vendor_category: vendor.category || 'General',
    vendor_location: vendor.location || 'Maharashtra'
  }, 1000);
}

export function trackServiceSelected(vendorId: string, service: { name: string; price: number; unit?: string; quantity?: number }): void {
  trackEvent('service_selected', {
    vendor_id: vendorId,
    service_name: service.name,
    service_price: service.price,
    service_unit: service.unit || 'fixed',
    service_quantity: service.quantity || 1
  });
}

export function trackCartOpened(itemCount: number, totalValue: number): void {
  trackEvent('cart_opened', {
    item_count: itemCount,
    value: totalValue,
    currency: 'INR'
  }, 1000);
}

export function trackCheckoutStarted(itemCount: number, totalValue: number): void {
  trackEvent('checkout_started', {
    item_count: itemCount,
    value: totalValue,
    currency: 'INR'
  });
}

export function trackPaymentInitiated(orderId: string, value: number): void {
  trackEvent('payment_initiated', {
    order_id: orderId,
    value,
    currency: 'INR',
    provider: 'CASHFREE'
  });
}

export function trackPaymentSuccess(orderId: string, transactionId: string, value: number): void {
  trackEvent('payment_success', {
    order_id: orderId,
    transaction_id: transactionId,
    value,
    currency: 'INR',
    provider: 'CASHFREE'
  });
}

export function trackPaymentFailed(orderId: string, reason?: string): void {
  trackEvent('payment_failed', {
    order_id: orderId,
    reason: reason || 'declined',
    currency: 'INR',
    provider: 'CASHFREE'
  });
}

export function trackBookingConfirmed(bookingId: string, vendorId: string, value: number): void {
  trackEvent('booking_confirmed', {
    booking_id: bookingId,
    vendor_id: vendorId,
    value,
    currency: 'INR'
  });
}

export function trackReceiptDownloaded(bookingId: string): void {
  trackEvent('receipt_downloaded', {
    booking_id: bookingId
  });
}

export function trackBookingCancelled(bookingId: string, reason?: string): void {
  trackEvent('booking_cancelled', {
    booking_id: bookingId,
    reason: reason ? reason.substring(0, 100) : 'customer_requested'
  });
}
