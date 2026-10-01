/**
 * Maps Firebase Auth error codes to customer-friendly messages.
 * Never exposes raw technical stack traces, internal errors, or credentials.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = typeof error === 'string' ? error : error?.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'Email or password is incorrect. Please check your credentials and try again.';

    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';

    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';

    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Please allow pop-ups and try again.';

    case 'auth/cancelled-popup-request':
      return 'Google sign-in request was cancelled. Please try again.';

    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many attempts. For your security, please wait a moment before trying again.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact Parva concierge support.';

    case 'auth/operation-not-allowed':
      return 'Sign-in method is currently disabled. Please contact support.';

    case 'auth/requires-recent-login':
      return 'Please sign in again to continue this action.';

    case 'auth/expired-action-code':
      return 'The password reset link has expired. Please request a new one.';

    case 'auth/invalid-action-code':
      return 'The password reset link is invalid. Please request a new one.';

    default:
      if (error?.message && typeof error.message === 'string' && !error.message.includes('Firebase:')) {
        return error.message;
      }
      return 'We could not complete your request right now. Please check your connection and try again.';
  }
}
