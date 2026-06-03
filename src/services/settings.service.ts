import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SiteSettings } from '@/types';

const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'global';

export const SettingsService = {
  /**
   * Fetches the global website settings document.
   * Returns a default set of values if the document does not exist yet.
   */
  async getSettings(): Promise<SiteSettings> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SiteSettings;
      }
      
      // Default website settings fallback
      const defaultSettings: SiteSettings = {
        siteName: 'EasyKart',
        siteTitle: 'EasyKart | Hand-Picked Products & Top Amazon Recommendations',
        siteDescription: 'Discover expert reviews, detailed buying guides, and the absolute best affiliate deals across home, fashion, electronics, and lifestyle gear.',
        contactEmail: 'admin@easykart.com',
        amazonAffiliateTag: 'easykart26-20',
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
        },
        logoURL: '',
        themeColor: 'violet',
        updatedAt: new Date().toISOString(),
      };
      
      return defaultSettings;
    } catch (error) {
      console.error('Error fetching global settings:', error);
      throw error;
    }
  },

  /**
   * Updates/Saves the global website settings
   */
  async updateSettings(settingsData: Omit<SiteSettings, 'updatedAt'>): Promise<SiteSettings> {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const updatedSettings: SiteSettings = {
        ...settingsData,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(docRef, updatedSettings, { merge: true });
      return updatedSettings;
    } catch (error) {
      console.error('Error updating global settings:', error);
      throw error;
    }
  }
};
