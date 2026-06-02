export const StorageService = {
  /**
   * Validates a file before compression or upload (checks type and size)
   */
  validateFile(file: File, maxSizeBytes = 2 * 1024 * 1024): { isValid: boolean; error: string | null } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.' 
      };
    }
    
    if (file.size > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `File size exceeds the limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.` 
      };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Compresses an image file on the client-side using Canvas.
   * Returns a promise resolving to a compressed Blob (as image/jpeg).
   * Note: Canvas compression is crucial to keep Base64 strings under Firestore's 1MB document limit!
   */
  compressImage(file: File, quality = 0.75, maxWidth = 800): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Build safety check for Server Side Rendering (SSR)
      if (typeof window === 'undefined') {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Enforce tighter bounds for Base64 document optimization
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to retrieve Canvas 2D Context.'));
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Determine output MIME type to preserve transparency
          const isTransparent = ['image/png', 'image/webp', 'image/gif'].includes(file.type);
          const outputMime = isTransparent ? 'image/png' : 'image/jpeg';

          // Convert canvas output to Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas compression output Blob is empty.'));
              }
            },
            outputMime,
            outputMime === 'image/jpeg' ? quality : undefined
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image element for canvas compression.'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file contents.'));
      };
    });
  },

  /**
   * Converts a file/blob to a Base64 Data URL string instead of writing to storage
   */
  async uploadFile(path: string, fileOrBlob: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return resolve('');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert image to Base64 format.'));
      };
      reader.readAsDataURL(fileOrBlob);
    });
  },

  /**
   * Deletes a file. Since Base64 is stored inline in Firestore documents, this is a noop.
   */
  async deleteFile(downloadURL: string): Promise<void> {
    // Noop since Base64 string data resides natively inside the Firestore doc.
    return;
  }
};
