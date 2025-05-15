
"use client"; 

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import type { Post as PostType } from '@/lib/types';
import { CommentsSection } from '@/components/CommentsSection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Tag as TagIcon, UserCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { postStore } from '@/lib/postStore';
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown'; // Uncommented
import rehypeRaw from 'rehype-raw'; // Uncommented

export default function PostPage({ params: paramsFromProps }: { params: { id: string } }) {
  const params = use(paramsFromProps as any); 
  const { id: postId } = params;

  const [post, setPost] = useState<PostType | undefined | null>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPost() {
      if (!postId) {
        setError("Post ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPost = await postStore.getPostById(postId);
        if (fetchedPost) {
          setPost(fetchedPost);
        } else {
          setPost(null);
          toast({ title: "Post Not Found", description: "The requested post does not exist or you may not have permission to view it.", variant: "destructive" });
        }
      } catch (err) {
        console.error(`Error fetching post ${postId}:`, err);
        const errorMessage = (err as Error).message || "Could not load the post. Please check your internet connection.";
        setError(errorMessage);
        toast({
          title: "Error Loading Post",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPost();
  }, [postId, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Error Loading Post</h1>
        <p className="text-muted-foreground mb-2">{error}</p>
         <p className="text-xs text-muted-foreground mb-6">
            Ensure Firebase is correctly configured (<code>src/lib/firebase.ts</code>, <code>.env.local</code>).
            Verify Firestore 'posts' collection data and security rules for read access.
            Check the browser console for specific Firebase errors.
          </p>
        <Button asChild className="mt-6">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
        </Button>
      </div>
    );
  }

  if (post === null) { 
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground">Sorry, we couldn&apos;t find the post you were looking for, or it may be a draft.</p>
        <Button asChild className="mt-6">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
        </Button>
      </div>
    );
  }
  
  if (!post) { 
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p>Post data is unavailable.</p>
         <Button asChild className="mt-6">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
        </Button>
      </div>
    );
  }

  const postTimestamp = post.timestamp;
  let dateObject: Date;

  if (postTimestamp instanceof Date) {
    dateObject = postTimestamp;
  } else if (typeof postTimestamp === 'string' || typeof postTimestamp === 'number') {
    dateObject = new Date(postTimestamp);
  } else {
    // Attempt to parse Firestore Timestamp-like object if it's not an instance
    const ts = postTimestamp as any;
    if (ts && typeof ts.seconds === 'number') {
        dateObject = new Timestamp(ts.seconds, ts.nanoseconds || 0).toDate();
    } else {
        console.warn("Unexpected timestamp format for post:", post.id, postTimestamp);
        dateObject = new Date(); 
    }
  }
  
  if (isNaN(dateObject.getTime())) {
    console.warn("Invalid date created for post timestamp:", post.id);
    dateObject = new Date(); 
  }


  const formattedDate = dateObject.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <article className="bg-card p-6 sm:p-8 rounded-lg shadow-xl">
        {post.imageUrl && (
          <div className="relative w-full h-64 sm:h-96 mb-8 rounded-lg overflow-hidden">
            <Image 
              src={post.imageUrl} 
              alt={post.title} 
              fill={true}
              style={{objectFit: "cover"}}
              priority 
              data-ai-hint="article header"
            />
          </div>
        )}
        
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-primary mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center space-x-4 text-muted-foreground text-sm">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                {post.author?.avatarUrl ? (
                  <AvatarImage src={post.author.avatarUrl} alt={post.author.name || 'Author'} data-ai-hint="author photo" />
                ) : (
                  <UserCircle className="h-5 w-5" />
                )}
                <AvatarFallback>{post.author?.name?.substring(0, 2).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <span>{post.author?.name || 'Unknown Author'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarDays className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
          {post.categories && post.categories.length > 0 && (
            <div className="mt-4">
              {post.categories.map(category => (
                <Badge key={category} variant="secondary" className="mr-2 mb-1">{category}</Badge>
              ))}
            </div>
          )}
        </header>

        <div 
          className="prose prose-lg dark:prose-invert max-w-none mb-8" 
        >
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <TagIcon className="h-5 w-5 text-muted-foreground" />
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        <div className="flex items-start space-x-4 bg-secondary/30 p-6 rounded-lg">
          <Avatar className="h-16 w-16">
            {post.author?.avatarUrl ? (
                <AvatarImage src={post.author.avatarUrl} alt={post.author.name || 'Author'} data-ai-hint="author detail" />
              ) : (
                <UserCircle className="h-10 w-10" />
              )}
            <AvatarFallback className="text-2xl">{post.author?.name?.substring(0, 2).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{post.author?.name || 'Unknown Author'}</h3>
            {post.author?.bio && <p className="text-muted-foreground mt-1 text-sm">{post.author.bio}</p>}
             {!post.author?.bio && post.author?.id !== 'unknown' && <p className="text-muted-foreground mt-1 text-sm italic">Author bio not available.</p>}
          </div>
        </div>
      </article>

      <CommentsSection postId={post.id} />
      
      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Posts</Link>
        </Button>
      </div>
    </div>
  );
}
