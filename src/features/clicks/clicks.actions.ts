'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { collection, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SettingsService } from '@/services/settings.service';

/**
 * Server Action to log affiliate click logs and redirect to destination Amazon URL
 * with dynamic global Amazon Associate Tag synchronization.
 */
export async function logAffiliateClickAndRedirect(
  productId: string, 
  productName: string, 
  affiliateUrl: string
) {
  const reqHeaders = await headers();
  const userAgent = reqHeaders.get('user-agent') || 'unknown';
  const referrer = reqHeaders.get('referer') || 'unknown';
  const ipAddress = reqHeaders.get('x-forwarded-for') || 'unknown';

  let destinationUrl = affiliateUrl;

  try {
    // 1. Fetch Global Settings to get the active Amazon Affiliate Tag
    const settings = await SettingsService.getSettings();
    const activeTag = settings.amazonAffiliateTag;

    // 2. Parse and dynamically inject the active associate tag into the Amazon link
    if (activeTag) {
      try {
        const urlObj = new URL(affiliateUrl);
        // Replace or append tag query param
        urlObj.searchParams.set('tag', activeTag);
        destinationUrl = urlObj.toString();
      } catch (e) {
        console.warn('Failed parsing product affiliate URL for tag injection, using raw link:', e);
      }
    }

    // 3. Log anonymized click log telemetry
    const clicksRef = collection(db, 'affiliate_clicks');
    const clickId = doc(clicksRef).id;
    const clickDocRef = doc(db, 'affiliate_clicks', clickId);

    const clickLog = {
      id: clickId,
      productId,
      productName,
      affiliateLink: destinationUrl,
      userId: null, // Anonymized customer click
      ipAddress,
      userAgent,
      referrer,
      timestamp: new Date().toISOString(),
    };

    await setDoc(clickDocRef, clickLog);

    // 4. Increment click count natively in product catalogue
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      clicksCount: increment(1)
    });
  } catch (error) {
    console.error('Error logging affiliate click telemetry:', error);
  }

  // 5. Outbound Redirect
  redirect(destinationUrl);
}
