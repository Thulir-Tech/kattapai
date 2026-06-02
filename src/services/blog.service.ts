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
import { Blog } from '@/types';

const COLLECTION_NAME = 'blogs';

export const BlogService = {
  /**
   * Fetches all blogs ordered by creation date (newest first)
   */
  async getAllBlogs(): Promise<Blog[]> {
    try {
      const blogsRef = collection(db, COLLECTION_NAME);
      const q = query(blogsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const blogs: Blog[] = [];
      querySnapshot.forEach((doc) => {
        blogs.push({ id: doc.id, ...doc.data() } as Blog);
      });
      
      return blogs;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  /**
   * Retrieves a single blog by its ID
   */
  async getBlogById(id: string): Promise<Blog | null> {
    try {
      const blogRef = doc(db, COLLECTION_NAME, id);
      const blogSnap = await getDoc(blogRef);
      if (blogSnap.exists()) {
        return { id: blogSnap.id, ...blogSnap.data() } as Blog;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching blog with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves a single blog by its unique slug
   */
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const blogsRef = collection(db, COLLECTION_NAME);
      const q = query(blogsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const blogDoc = querySnapshot.docs[0];
        return { id: blogDoc.id, ...blogDoc.data() } as Blog;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching blog with slug ${slug}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new blog. Generates a document ID if not explicitly specified.
   */
  async createBlog(blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<Blog> {
    try {
      const docId = customId || blogData.slug || doc(collection(db, COLLECTION_NAME)).id;
      const blogRef = doc(db, COLLECTION_NAME, docId);
      
      const newBlog: Blog = {
        ...blogData,
        id: docId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(blogRef, newBlog);
      return newBlog;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  },

  /**
   * Updates an existing blog
   */
  async updateBlog(id: string, blogData: Partial<Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const blogRef = doc(db, COLLECTION_NAME, id);
      const updatePayload = {
        ...blogData,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(blogRef, updatePayload, { merge: true });
    } catch (error) {
      console.error(`Error updating blog with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a blog by its ID
   */
  async deleteBlog(id: string): Promise<void> {
    try {
      const blogRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(blogRef);
    } catch (error) {
      console.error(`Error deleting blog with ID ${id}:`, error);
      throw error;
    }
  }
};
