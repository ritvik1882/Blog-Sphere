
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/lib/types';
import { Loader2, SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { postStore } from '@/lib/postStore';
import { useToast } from '@/hooks/use-toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true); // True while fetching initial posts
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPostsForSearch() {
      setIsLoading(true);
      try {
        const publishedPosts = await postStore.getPublishedPosts();
        setAllPosts(publishedPosts);
      } catch (err) {
        console.error("Error fetching posts for search:", err);
        toast({
          title: "Error Loading Posts",
          description: (err as Error).message || "Could not load posts for search.",
          variant: "destructive"
        });
        setAllPosts([]);
      } finally {
        setIsLoading(false); // Ensure loading is set to false after fetch attempt
      }
    }
    fetchPostsForSearch();
  }, [toast]); // Runs once on mount (assuming toast is stable)

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    if (isLoading) { // If initial posts are still loading, don't filter yet
      return;
    }

    const filteredPosts = allPosts.filter(post =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(query.toLowerCase())) || // Added check for excerpt existence
      (post.author?.name && post.author.name.toLowerCase().includes(query.toLowerCase())) ||
      post.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase())) ||
      post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(filteredPosts);

  }, [query, allPosts, isLoading]); // Re-filter when query, allPosts change, or initial loading finishes

  if (!query && !isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Enter a search term</h1>
        <p className="text-muted-foreground">Please use the search bar in the header to find content.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">
        Search Results for: <span className="text-primary">&quot;{query}&quot;</span>
      </h1>
      <p className="text-muted-foreground mb-8">
        {isLoading && query ? 'Loading posts...' : `${searchResults.length} results found.`}
      </p>

      {isLoading && query ? ( // Show loader if loading initial posts AND a query is present
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {searchResults.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : query ? ( // Only show "No results" if there's an active query and we are not loading
        <div className="text-center py-20">
          <SearchX className="mx-auto h-24 w-24 text-muted-foreground/50 mb-6" />
          <p className="text-xl text-muted-foreground mb-4">No results found for &quot;{query}&quot;.</p>
          <p className="text-sm text-muted-foreground">Try a different search term or browse all posts.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      ) : null }
    </div>
  );
}
