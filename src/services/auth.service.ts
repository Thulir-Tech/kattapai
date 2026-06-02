import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User as AppUser } from '@/types';

export const AuthService = {
  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  /**
   * Get current authenticated user synchronous state
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Check if a specific user uid has the "admin" role in Firestore
   */
  async checkAdminRole(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(db, 'users', uid);
      let userDocSnap;

      try {
        // Try fetching online from server
        userDocSnap = await getDoc(userDocRef);
      } catch (err: any) {
        // Fallback to cache if network is offline or unavailable
        if (err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('network')) {
          console.warn('Firestore server is unreachable (offline). Falling back to local cache...');
          try {
            userDocSnap = await getDocFromCache(userDocRef);
          } catch (cacheErr: any) {
            console.error('Failed to get user document from local cache (cache-miss):', cacheErr.message || cacheErr);
            return false; // Safely deny access as we cannot verify credentials
          }
        } else {
          throw err;
        }
      }
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as AppUser;
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Error verifying admin status in Firestore:', error);
      return false;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
