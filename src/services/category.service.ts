import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Category } from '@/types';

const COLLECTION_NAME = 'categories';

export const CategoryService = {
  /**
   * Fetches all categories ordered by name
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, COLLECTION_NAME);
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Retrieves a single category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      const categorySnap = await getDoc(categoryRef);
      if (categorySnap.exists()) {
        return { id: categorySnap.id, ...categorySnap.data() } as Category;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new category. Generates an ID if not explicitly specified.
   */
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<Category> {
    try {
      // If customId is not specified, use a normalized URL-friendly slug as the document ID
      const docId = customId || categoryData.slug || doc(collection(db, COLLECTION_NAME)).id;
      const categoryRef = doc(db, COLLECTION_NAME, docId);
      
      const newCategory: Category = {
        ...categoryData,
        id: docId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(categoryRef, newCategory);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * Updates an existing category
   */
  async updateCategory(id: string, categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      const updatePayload = {
        ...categoryData,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(categoryRef, updatePayload, { merge: true });
    } catch (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a category by its ID
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    }
  }
};
