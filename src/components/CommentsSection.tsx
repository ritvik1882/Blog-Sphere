
"use client";

import type { Comment } from '@/lib/types';
import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Send, Loader2, Trash2 } from 'lucide-react'; // Removed Edit icon
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
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

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    setIsLoadingComments(true);
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedComments.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
        } as Comment);
      });
      setComments(fetchedComments);
      setIsLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments in real-time: ", error);
      toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [postId, toast]);


  const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive" });
      return;
    }

    setIsSubmittingComment(true);
    
    const commentPayload = {
      userId: user.id,
      user: { 
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl || undefined,
      },
      content: newComment.trim(),
      timestamp: serverTimestamp(),
    };

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, commentPayload);
      setNewComment('');
      toast({ title: "Comment Posted!", description: "Your comment has been added." });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not post comment.", variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    setIsDeletingComment(commentId);
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      toast({ title: "Comment Deleted", description: "Your comment has been removed." });
    } catch (error) {
      console.error("Error deleting comment: ", error);
      toast({ title: "Error", description: (error as Error).message || "Could not delete comment.", variant: "destructive" });
    } finally {
      setIsDeletingComment(null);
    }
  };

  // Removed handleEditComment function

  const formatTimestamp = (timestamp: Timestamp | Date | string) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Card className="mt-12 shadow-lg" id="comments">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-8 space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="focus-visible:ring-primary"
            />
            <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
              {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </Button>
          </form>
        )}
        {!user && (
          <p className="mb-8 text-muted-foreground">
            Please <a href="/login" className="text-primary hover:underline">login</a> to post a comment.
          </p>
        )}
        
        {isLoadingComments ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 py-4 border-b border-border last:border-b-0">
              <Avatar className="h-10 w-10">
                {comment.user?.avatarUrl ? (
                  <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} data-ai-hint="user avatar"/>
                ) : (
                   <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
                <AvatarFallback>{comment.user?.name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary/30 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-foreground">{comment.user?.name || 'Anonymous'}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</p>
                    {user && user.id === comment.user?.id && (
                      <>
                        {/* Edit button removed */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" title="Delete comment">
                              {isDeletingComment === comment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={!!isDeletingComment}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteComment(comment.id)} 
                                disabled={!!isDeletingComment}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                {isDeletingComment === comment.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
        )}
      </CardContent>
    </Card>
  );
}
