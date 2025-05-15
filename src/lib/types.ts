
import type { Timestamp } from 'firebase/firestore';

// Represents user data as stored/retrieved from Firestore profiles
// and as presented by the AuthContext.
export interface User {
  id: string; // This will be the uid from Firebase Authentication
  name: string;
  email: string | null; // Email from Firebase Auth
  avatarUrl?: string; // URL for the avatar image
  bio?: string; // Short user biography
  // Firebase Auth specific fields like displayName or photoURL can be used internally
  // by AuthContext but the goal is to provide this unified User interface.
}

export type AuthenticatedUser = User; // AuthenticatedUser is now the same as our refined User interface

export interface Comment {
  id: string;
  user: { // Simplified user info for embedding in comments
    id: string;
    name: string;
    avatarUrl?: string;
  };
  postId: string;
  content: string;
  timestamp: Timestamp | Date | string;
}

export interface Post {
  id:string;
  title: string;
  excerpt: string;
  content: string; // Rich text / HTML content
  author: { // Simplified author info for embedding in posts
    id: string;
    name: string;
    avatarUrl?: string;
  };
  authorId: string; // Store authorId for easier querying, matches author.id
  timestamp: Timestamp | Date | string;
  categories: string[];
  tags: string[];
  imageUrl?: string;
  commentCount?: number;
  status: 'published' | 'draft';
}

export type NewPostData = Omit<Post, 'id' | 'author' | 'timestamp' | 'commentCount'> & { authorId: string };
export type UpdatePostData = Partial<Omit<Post, 'author' | 'timestamp'>> & { id: string };

export type NewCommentData = {
  postId: string;
  userId: string;
  content: string;
  // User details (name, avatarUrl) for embedding will be sourced from the authenticated user
};
