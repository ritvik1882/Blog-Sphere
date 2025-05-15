
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }), // Will be read-only effectively
  bio: z.string().max(200, { message: "Bio cannot exceed 200 characters." }).optional().or(z.literal('')),
  avatarUrl: z.string().url({ message: "Please enter a valid URL for avatar." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, updateProfile, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/profile');
      toast({ title: "Authentication Required", description: "Please log in to view your profile.", variant: "destructive" });
    } else if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, authLoading, router, form, toast]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Email is not part of the data passed to updateProfile context function
      // as Firebase email updates are more complex.
      await updateProfile({
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      });
      // Toast is handled by updateProfile in AuthContext
    } catch (error) {
      // Toast is handled by updateProfile in AuthContext if it throws
    }
    setIsSubmitting(false);
  }

  if (authLoading) {
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
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-fit mb-4 relative group">
            <UserAvatar user={user} className="h-32 w-32 text-4xl border-4 border-primary shadow-md" />
            <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full group-hover:opacity-100 opacity-70 transition-opacity" onClick={() => document.getElementById('avatarUrl')?.focus()}>
              <Edit className="h-4 w-4"/>
              <span className="sr-only">Edit Avatar</span>
            </Button>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} readOnly />
                    </FormControl>
                    <FormDescription>
                      Email address cannot be changed here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Avatar URL</FormLabel>
                    <FormControl>
                      <Input id="avatarUrl" type="url" placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little about yourself..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || authLoading}>
                  {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={logout} disabled={authLoading}>
                  Logout
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
