
"use client";

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Loader2, FilePlus } from 'lucide-react';
import { postStore } from '@/lib/postStore';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      setError(null);
      try {
        const publishedPosts = await postStore.getPublishedPosts();
        setPosts(publishedPosts);
      } catch (err) {
        console.error("Error fetching published posts:", err);
        const errorMessage = (err as Error).message || "Could not load posts. Please check your internet connection.";
        setError(errorMessage);
        toast({
          title: "Error Loading Posts",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-3xl">
      {error && (
         <div className="text-center py-12 bg-card p-8 rounded-lg shadow-md border border-destructive">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <p className="text-xl text-destructive mb-2">Error Loading Posts</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <p className="text-xs text-muted-foreground mb-6">
            Please ensure your Firebase project is correctly configured in <code>src/lib/firebase.ts</code> and <code>.env.local</code>.
            Verify that your Firestore database has data in the 'posts' collection and that your security rules allow read access.
            Check the browser console for more detailed error messages from Firebase, including any missing index errors.
          </p>
          <Button asChild>
            <Link href="/create-post"> <FilePlus className="mr-2 h-4 w-4" /> Create Your First Post</Link>
          </Button>
        </div>
      )}

      {!error && posts.length === 0 && (
         <div className="text-center py-12 bg-card p-8 rounded-lg shadow-md">
          <FilePlus className="mx-auto h-16 w-16 text-muted-foreground/70 mb-4" />
          <p className="text-xl text-muted-foreground mb-2">No posts yet.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first to share your thoughts!
          </p>
          <Button asChild>
            <Link href="/create-post"> <FilePlus className="mr-2 h-4 w-4" /> Create Your First Post</Link>
          </Button>
        </div>
      )}

      {!error && posts.length > 0 && (
        <div className="flex flex-col divide-y divide-border">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}
