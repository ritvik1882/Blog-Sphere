
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { postStore } from '@/lib/postStore';
import type { UpdatePostData } from '@/lib/types';

const postFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  excerpt: z.string().max(200, { message: "Excerpt cannot exceed 200 characters." }).optional().or(z.literal('')), // Min length removed
  content: z.string().optional().or(z.literal('')), // Min length removed
  categories: z.string().optional(), 
  tags: z.string().optional(), 
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function CreatePostPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      categories: "",
      tags: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/create-post');
      toast({ title: "Authentication Required", description: "Please log in to create or edit a post.", variant: "destructive" });
    }

    const draftId = searchParams.get('draftId');
    if (draftId && user) { 
      setIsLoadingDraft(true);
      postStore.getPostById(draftId).then(draftPost => {
        if (draftPost && draftPost.authorId === user.id) {
          form.reset({
            title: draftPost.title,
            excerpt: draftPost.excerpt,
            content: draftPost.content,
            categories: draftPost.categories?.join(', ') || '',
            tags: draftPost.tags?.join(', ') || '',
            imageUrl: draftPost.imageUrl || "",
          });
          setEditingPostId(draftPost.id);
          if (draftPost.status === 'draft') {
            toast({ title: "Editing Draft", description: `Loaded draft: "${draftPost.title}"`});
          } else {
             toast({ title: "Editing Post", description: `Loaded post: "${draftPost.title}"`});
          }
        } else if (draftPost) {
          toast({ title: "Error", description: "You are not authorized to edit this item.", variant: "destructive" });
          router.replace('/my-content'); 
        } else {
          toast({ title: "Error", description: "Item not found.", variant: "destructive" });
          router.replace('/my-content'); 
        }
      }).catch(error => {
        toast({ title: "Error Loading Item", description: (error as Error).message || "Could not load item.", variant: "destructive" });
        router.replace('/my-content'); 
      }).finally(() => {
        setIsLoadingDraft(false);
      });
    }
  }, [user, authLoading, router, toast, searchParams, form]);


  async function handleSave(data: PostFormValues, status: 'published' | 'draft') {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const postDetailsBase = {
      title: data.title,
      excerpt: data.excerpt || '', // ensure it's not undefined
      content: data.content || '', // ensure it's not undefined
      categories: data.categories?.split(',').map(c => c.trim()).filter(Boolean) || [],
      tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
      imageUrl: data.imageUrl || undefined, 
      status,
      authorId: user.id, 
    };

    try {
      if (editingPostId) {
        const updatePayload: UpdatePostData = {
            ...postDetailsBase,
            id: editingPostId,
        };
        await postStore.updatePost(updatePayload);
        toast({ title: `Post ${status === 'draft' ? 'Draft Updated' : 'Updated'}!`, description: `Your post "${data.title}" has been updated.` });
        if (status === 'published') {
            router.push(`/posts/${editingPostId}`);
        } else {
            router.push('/my-content'); 
        }
      } else {
        const newPostPayload = {
            title: data.title,
            excerpt: data.excerpt || '',
            content: data.content || '',
            categories: data.categories?.split(',').map(c => c.trim()).filter(Boolean) || [],
            tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
            imageUrl: data.imageUrl || undefined,
            status,
        };
        const newPost = await postStore.addPost(newPostPayload, user); 
        if (status === 'published') {
          toast({ title: "Post Published!", description: `Your new post "${data.title}" has been published.` });
          router.push(`/posts/${newPost.id}`);
        } else {
          toast({ title: "Draft Saved!", description: `Your draft "${data.title}" has been saved.` });
          router.push('/my-content'); 
        }
      }
    } catch (error) {
        toast({ title: "Save Failed", description: (error as Error).message || "Could not save the post. Check Firebase connection and setup.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (authLoading || isLoadingDraft) {
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

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            {editingPostId ? "Edit Post" : "Create New Post"}
          </CardTitle>
          <CardDescription className="text-center">
            {editingPostId ? "Refine your existing content." : "Share your thoughts with the world."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => handleSave(data, 'published'))} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your amazing post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Excerpt (Short Summary)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief summary of your post (max 200 characters)" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Content</FormLabel>
                    <FormControl>
                      <RichTextEditor 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write your post content here..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Featured Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Categories (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Lifestyle, Travel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., nextjs, productivity, ai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.handleSubmit(data => handleSave(data, 'draft'))()}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Draft
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? (editingPostId ? "Updating..." : "Publishing...") : (editingPostId ? "Update Post" : "Publish Post")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
