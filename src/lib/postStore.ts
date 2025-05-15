
'use client';

import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Post, AuthenticatedUser, UpdatePostData, NewPostData } from './types';

// Helper to convert Firestore doc to Post, handling Timestamps and author
const fromFirestore = (docSnap: DocumentData): Post => {
  const data = docSnap.data();

  let parsedTimestamp: Date;
  if (data.timestamp instanceof Timestamp) {
    parsedTimestamp = data.timestamp.toDate();
  } else if (data.timestamp && (typeof data.timestamp === 'string' || typeof data.timestamp === 'number' || data.timestamp.seconds)) {
    try {
      const seconds = data.timestamp.seconds || (typeof data.timestamp === 'number' ? data.timestamp / 1000 : undefined);
      const nanoseconds = data.timestamp.nanoseconds || 0;
      if (seconds !== undefined) {
        parsedTimestamp = new Timestamp(seconds, nanoseconds).toDate();
      } else {
        parsedTimestamp = new Date(data.timestamp);
      }
    } catch (e) {
      console.warn(`Post with ID ${docSnap.id} has an unparseable timestamp. Using current date as fallback. Error: ${(e as Error).message}`);
      parsedTimestamp = new Date(); // Fallback
    }
  } else {
    console.warn(`Post with ID ${docSnap.id} is missing a timestamp or it's in an unexpected format. Using current date as fallback.`);
    parsedTimestamp = new Date(); // Fallback to current date
  }

  if (isNaN(parsedTimestamp.getTime())) {
    console.warn(`Post with ID ${docSnap.id} resulted in an Invalid Date for timestamp. Using current date as fallback.`);
    parsedTimestamp = new Date(); // Fallback for "Invalid Date"
  }
  
  const authorData = data.author || {}; // Ensure author is an object

  return {
    id: docSnap.id,
    title: data.title || 'Untitled Post',
    excerpt: data.excerpt || '',
    content: data.content || '',
    author: {
      id: authorData.id || data.authorId || 'unknown',
      name: authorData.name || 'Unknown Author',
      avatarUrl: authorData.avatarUrl, 
    },
    authorId: data.authorId || 'unknown',
    categories: data.categories || [],
    tags: data.tags || [],
    imageUrl: data.imageUrl, 
    commentCount: data.commentCount || 0,
    status: data.status || 'draft',
    timestamp: parsedTimestamp,
  } as Post;
};

const postsCollection = collection(db, 'posts');

export const postStore = {
  getAllPosts: async (): Promise<Post[]> => {
    try {
      const q = query(postsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(fromFirestore);
    } catch (error) {
      console.error("Error fetching all posts:", error);
      throw error;
    }
  },

  getPostsByAuthorAndStatus: async (authorId: string, status: 'published' | 'draft'): Promise<Post[]> => {
    try {
      const q = query(
        postsCollection,
        where('authorId', '==', authorId),
        where('status', '==', status),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(fromFirestore);
    } catch (error) {
      console.error(`Error fetching posts for author ${authorId} with status ${status}:`, error);
      throw error;
    }
  },

  getPublishedPosts: async (): Promise<Post[]> => {
    try {
      const q = query(postsCollection, where('status', '==', 'published'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(fromFirestore);
    } catch (error) { // Added curly braces here
      console.error("Error fetching published posts:", error);
      throw error;
    }
  },
  
  getPostById: async (id: string): Promise<Post | undefined> => {
    try {
      const docRef = doc(db, 'posts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return fromFirestore(docSnap);
      }
      console.warn(`Post with id ${id} not found.`);
      return undefined;
    } catch (error) {
      console.error(`Error fetching post ${id}:`, error);
      throw error;
    }
  },

  addPost: async (postData: Omit<Post, 'id' | 'timestamp' | 'comments' | 'commentCount' | 'author'>, author: AuthenticatedUser): Promise<Post> => {
    try {
      const payloadForFirestore: DocumentData = {
        title: postData.title,
        excerpt: postData.excerpt,
        content: postData.content,
        author: { 
          id: author.id,
          name: author.name,
          avatarUrl: author.avatarUrl || undefined, // Firestore omits undefined fields
        },
        authorId: author.id,
        categories: postData.categories,
        tags: postData.tags,
        status: postData.status,
        timestamp: serverTimestamp(), 
        commentCount: 0,
      };
      
      if (postData.imageUrl !== undefined) {
        payloadForFirestore.imageUrl = postData.imageUrl;
      }
      
      const docRef = await addDoc(postsCollection, payloadForFirestore);
      const newPostDoc = await getDoc(docRef);
      if (newPostDoc.exists()) {
        return fromFirestore(newPostDoc);
      }
      // Fallback if getDoc fails immediately, though unlikely
      const createdTimestamp = new Date(); // Approximate timestamp
      return { 
        ...postData, 
        id: docRef.id, 
        timestamp: createdTimestamp,
        author: {id: author.id, name: author.name, avatarUrl: author.avatarUrl},
        commentCount: 0
      } as Post; 
    } catch (error) {
      console.error("Error adding post:", error);
      throw error;
    }
  },

  updatePost: async (updatedPostData: UpdatePostData): Promise<Post | undefined> => {
    try {
      const postRef = doc(db, 'posts', updatedPostData.id);
      
      const finalUpdatePayload: DocumentData = {};
      // Iterate over the keys of the input data, excluding 'id'
      Object.keys(updatedPostData).forEach(key => {
        if (key === 'id') return; // Skip 'id' as it's for the doc ref
        const value = (updatedPostData as any)[key];
        if (value !== undefined) { // Only include defined values
          finalUpdatePayload[key] = value;
        }
      });
      finalUpdatePayload.lastModifiedAt = serverTimestamp();

      await updateDoc(postRef, finalUpdatePayload);
      const updatedDoc = await getDoc(postRef);
      if (updatedDoc.exists()) {
        return fromFirestore(updatedDoc);
      }
      return undefined;
    } catch (error) {
      console.error(`Error updating post ${updatedPostData.id}:`, error);
      throw error;
    }
  },

  deletePost: async (id: string): Promise<void> => {
    try {
      const postRef = doc(db, 'posts', id);
      const commentsRef = collection(db, 'posts', id, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      const batch = writeBatch(db);
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(doc(db, 'posts', id, 'comments', commentDoc.id));
      });
      batch.delete(postRef);
      await batch.commit();
      console.log(`Post ${id} and its comments deleted.`);
    } catch (error) {
      console.error(`Error deleting post ${id}:`, error);
      throw error;
    }
  },
};

