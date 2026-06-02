import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types';

const COLLECTION_NAME = 'products';

export const ProductService = {
  /**
   * Fetches all products ordered by creation date (newest first)
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Fetches products belonging to a specific category
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      const q = query(
        productsRef, 
        where('categoryId', '==', categoryId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      return products;
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a single product by its ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new product. Generates a document ID if not explicitly specified.
   */
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<Product> {
    try {
      const docId = customId || productData.slug || doc(collection(db, COLLECTION_NAME)).id;
      const productRef = doc(db, COLLECTION_NAME, docId);
      
      const newProduct: Product = {
        ...productData,
        id: docId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(productRef, newProduct);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Updates an existing product
   */
  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      const updatePayload = {
        ...productData,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(productRef, updatePayload, { merge: true });
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a product by its ID
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a single product by its unique slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      const q = query(productsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        return { id: productDoc.id, ...productDoc.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw error;
    }
  }
};
