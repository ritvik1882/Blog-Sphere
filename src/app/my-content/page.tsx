
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, PlusCircle, Edit, AlertTriangle, Archive, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { postStore } from '@/lib/postStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyContentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userDrafts, setUserDrafts] = useState<Post[]>([]);
  const [userPublishedPosts, setUserPublishedPosts] = useState<Post[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserContent = () => {
    if (user) {
      setIsLoadingContent(true);
      setFetchError(null);
      Promise.all([
        postStore.getPostsByAuthorAndStatus(user.id, 'draft'),
        postStore.getPostsByAuthorAndStatus(user.id, 'published')
      ]).then(([drafts, published]) => {
        setUserDrafts(drafts);
        setUserPublishedPosts(published);
      }).catch(error => {
        console.error("Failed to fetch user content:", error);
        const errorMessage = (error as Error).message || "Could not load your content. Please try again.";
        toast({ title: "Error Loading Content", description: errorMessage, variant: "destructive" });
        setFetchError(errorMessage);
      }).finally(() => {
        setIsLoadingContent(false);
      });
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/my-content');
      toast({ title: "Authentication Required", description: "Please log in to view your content.", variant: "destructive" });
      setIsLoadingContent(false);
      return;
    } 
    fetchUserContent();
  }, [user, authLoading, router, toast]);

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      await postStore.deletePost(postId);
      toast({ title: "Post Deleted", description: "The post has been successfully deleted." });
      // Refresh content
      setUserDrafts(prev => prev.filter(p => p.id !== postId));
      setUserPublishedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Deletion Failed", description: (error as Error).message || "Could not delete the post.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  if (authLoading || (isLoadingContent && !fetchError) ) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { 
     return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const renderPostList = (posts: Post[], type: 'draft' | 'published') => {
    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          {type === 'draft' ? <Archive className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" /> : <Send className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" />}
          <p className="text-xl text-muted-foreground">
            You don&apos;t have any {type === 'draft' ? 'drafts' : 'published posts'} yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/create-post">
              <PlusCircle className="mr-2 h-4 w-4" /> Start a New Post
            </Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col divide-y divide-border">
        {posts.map((post) => (
          <AlertDialog key={post.id}>
            <PostCard 
              post={post} 
              layout="list" 
              showEditButton={true}
              deleteActionSlot={
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-auto py-1.5 px-2.5 text-xs" disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </AlertDialogTrigger>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the post
                  &quot;{post.title}&quot; and all its associated comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeletePost(post.id)} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <FileText className="mr-3 h-8 w-8 md:h-10 md:w-10" /> My Content
        </h1>
        <Button asChild>
          <Link href="/create-post">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
          </Link>
        </Button>
      </div>

      {fetchError && (
        <div className="text-center py-12 bg-destructive/10 p-8 rounded-lg shadow-md border border-destructive">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <p className="text-xl text-destructive mb-2">Failed to Load Your Content</p>
          <p className="text-sm text-destructive/80 mb-6">{fetchError}</p>
           <p className="text-xs text-muted-foreground mb-6">
            Please ensure your Firebase project is correctly configured and security rules allow access.
            Check the browser console for more detailed error messages.
          </p>
        </div>
      )}

      {!fetchError && (
        <Tabs defaultValue="published" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6">
            <TabsTrigger value="published">Published ({userPublishedPosts.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({userDrafts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="published">
            {renderPostList(userPublishedPosts, 'published')}
          </TabsContent>
          <TabsContent value="drafts">
            {renderPostList(userDrafts, 'draft')}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
