import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AffiliateClick, Product, Category } from '@/types';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';

const COLLECTION_NAME = 'affiliate_clicks';

export interface AnalyticsTrendPoint {
  date: string; // "YYYY-MM-DD"
  clicks: number;
}

export interface ProductClickRank {
  productId: string;
  productTitle: string;
  clicks: number;
}

export interface CategoryClickSplit {
  categoryId: string;
  categoryName: string;
  clicks: number;
}

export interface AnalyticsDashboardData {
  totalClicks: number;
  dailyTrends: AnalyticsTrendPoint[];
  topProducts: ProductClickRank[];
  topCategories: CategoryClickSplit[];
}

export const AnalyticsService = {
  /**
   * Logs a new affiliate click to Firestore (Anonymous and Insert-only)
   */
  async logAffiliateClick(clickData: Omit<AffiliateClick, 'id' | 'timestamp'>): Promise<void> {
    try {
      const clicksRef = collection(db, COLLECTION_NAME);
      const docId = doc(clicksRef).id;
      const clickDocRef = doc(db, COLLECTION_NAME, docId);
      
      const newClick: AffiliateClick = {
        ...clickData,
        id: docId,
        timestamp: new Date().toISOString(),
      };
      
      await setDoc(clickDocRef, newClick);
    } catch (error) {
      console.error('Error logging affiliate click:', error);
      throw error;
    }
  },

  /**
   * Fetches all click logs
   */
  async getAllClicks(): Promise<AffiliateClick[]> {
    try {
      const clicksRef = collection(db, COLLECTION_NAME);
      const q = query(clicksRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const clicks: AffiliateClick[] = [];
      querySnapshot.forEach((doc) => {
        clicks.push({ id: doc.id, ...doc.data() } as AffiliateClick);
      });
      return clicks;
    } catch (error) {
      console.error('Error fetching click logs:', error);
      throw error;
    }
  },

  /**
   * Gathers all databases and performs multi-dimensional client-side analytics aggregations
   */
  async getDashboardAnalytics(daysLimit = 7): Promise<AnalyticsDashboardData> {
    try {
      // 1. Fetch raw logs and entities concurrently
      const [clicks, products, categories] = await Promise.all([
        this.getAllClicks(),
        ProductService.getAllProducts(),
        CategoryService.getAllCategories()
      ]);

      const totalClicks = clicks.length;

      // 2. Aggregate Click Trends (Daily count for the last N days)
      const trendMap: Record<string, number> = {};
      
      // Initialize trend map keys with the last N days
      for (let i = daysLimit - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        trendMap[key] = 0;
      }

      clicks.forEach(click => {
        const dateKey = click.timestamp.split('T')[0];
        if (dateKey in trendMap) {
          trendMap[dateKey]++;
        }
      });

      const dailyTrends: AnalyticsTrendPoint[] = Object.entries(trendMap).map(([date, count]) => ({
        date,
        clicks: count
      }));

      // 3. Aggregate Top Clicked Products
      const productClicks: Record<string, number> = {};
      clicks.forEach(click => {
        productClicks[click.productId] = (productClicks[click.productId] || 0) + 1;
      });

      const topProducts: ProductClickRank[] = Object.entries(productClicks)
        .map(([prodId, count]) => {
          const product = products.find(p => p.id === prodId);
          return {
            productId: prodId,
            productTitle: product ? product.title : 'Deleted Product',
            clicks: count
          };
        })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5); // top 5 products

      // 4. Aggregate Top Categories Click splits
      const categoryClicks: Record<string, number> = {};
      clicks.forEach(click => {
        const product = products.find(p => p.id === click.productId);
        if (product && product.categoryId) {
          categoryClicks[product.categoryId] = (categoryClicks[product.categoryId] || 0) + 1;
        }
      });

      const topCategories: CategoryClickSplit[] = Object.entries(categoryClicks)
        .map(([catId, count]) => {
          const category = categories.find(c => c.id === catId);
          return {
            categoryId: catId,
            categoryName: category ? category.name : 'Unknown Category',
            clicks: count
          };
        })
        .sort((a, b) => b.clicks - a.clicks);

      return {
        totalClicks,
        dailyTrends,
        topProducts,
        topCategories
      };

    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      throw error;
    }
  }
};
