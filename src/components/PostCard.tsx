
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Tag as TagIcon, UserCircle, Edit, MessageSquareText } from 'lucide-react';
import { Button } from './ui/button';

interface PostCardProps {
  post: Post;
  layout?: 'grid' | 'list';
  showEditButton?: boolean;
  deleteActionSlot?: React.ReactNode;
}

export function PostCard({ post, layout = 'grid', showEditButton = false, deleteActionSlot }: PostCardProps) {
  const { id, title, excerpt, author, timestamp, categories, tags, imageUrl, commentCount, status } = post;

  let dateObject: Date;
  if (timestamp instanceof Date) {
    dateObject = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    dateObject = new Date(timestamp);
  } else {
    const ts = timestamp as any;
    if (ts && typeof ts.seconds === 'number') {
      dateObject = new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
    } else {
      console.warn(`PostCard received unexpected timestamp format for post ${id}`);
      dateObject = new Date();
    }
  }

  if (isNaN(dateObject.getTime())) {
    console.warn(`PostCard produced Invalid Date for post ${id}`);
    dateObject = new Date();
  }

  const formattedDate = dateObject.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const postLink = status === 'published' ? `/posts/${id}` : `/create-post?draftId=${id}`;
  const editLink = `/create-post?draftId=${id}`;

  if (layout === 'list') {
    return (
      <div className="w-full overflow-hidden hover:bg-muted/20 transition-colors duration-200 py-6 px-2 sm:px-1">
        <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
          <div className="flex-1 space-y-2 order-2 sm:order-1">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Avatar className="h-6 w-6">
                {author?.avatarUrl ? (
                  <AvatarImage src={author.avatarUrl} alt={author.name || 'Author'} data-ai-hint="author portrait" />
                ) : (
                  <UserCircle className="h-4 w-4" />
                )}
                <AvatarFallback className="text-xs">{author?.name?.substring(0, 1).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground/90">{author?.name || 'Unknown Author'}</span>
              <span>&middot;</span>
              <span>{formattedDate}</span>
              {status === 'draft' && <Badge variant="outline" className="ml-2 text-xs">Draft</Badge>}
            </div>

            <Link href={postLink} className="group">
              <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h2>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3">
              {excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs pt-1">
              {categories && categories.length > 0 && (
                <Badge variant="secondary" className="font-normal">{categories[0]}</Badge>
              )}
              {tags && tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-muted-foreground hover:text-primary transition-colors">#{tag}</span>
              ))}
              {status === 'published' && commentCount !== undefined && commentCount > 0 && (
                <Link href={`${postLink}#comments`} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <MessageSquareText className="h-3 w-3" />
                  {commentCount} Comment{commentCount === 1 ? '' : 's'}
                </Link>
              )}
              <div className="ml-auto flex items-center space-x-2">
                {showEditButton && (
                  <Button asChild variant="outline" size="sm" className="h-auto py-1.5 px-2.5 text-xs">
                    <Link href={editLink}>
                      <Edit className="mr-1 h-3 w-3" /> Edit
                    </Link>
                  </Button>
                )}
                {deleteActionSlot}
              </div>
            </div>
          </div>

          {imageUrl && (
            <Link href={postLink} className="flex-shrink-0 order-1 sm:order-2 w-full sm:w-auto">
              <div className="relative w-full h-40 sm:w-32 sm:h-32 md:w-48 md:h-32 lg:w-56 lg:h-36 rounded-md overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  style={{objectFit:"cover"}}
                  data-ai-hint="article list"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 128px, (max-width: 1024px) 192px, 224px"
                />
              </div>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      {imageUrl && (
        <Link href={postLink} className="block">
          <div className="relative w-full h-48 bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              style={{objectFit:"cover"}}
              data-ai-hint="blog nature"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}
      <CardHeader className="pb-3">
        <Link href={postLink} className="hover:text-primary transition-colors">
          <CardTitle className="text-xl font-semibold leading-tight line-clamp-2">
            {title}
          </CardTitle>
        </Link>
        {status === 'draft' && <Badge variant="outline" className="mt-1 w-fit text-xs">Draft</Badge>}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground pt-1">
          <Avatar className="h-6 w-6">
            {author?.avatarUrl ? (
              <AvatarImage src={author.avatarUrl} alt={author.name || 'Author'} data-ai-hint="author portrait" />
            ) : (
              <UserCircle className="h-4 w-4" />
            )}
            <AvatarFallback className="text-xs">{author?.name?.substring(0, 1).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <span>{author?.name || 'Unknown Author'}</span>
          <span className="mx-1">&middot;</span>
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow py-0">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{excerpt}</p>
        {categories && categories.length > 0 && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs font-normal">{categories[0]}</Badge>
          </div>
        )}
      </CardContent>
      <div className="border-t mt-3 p-4 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <TagIcon className="h-3 w-3" />
          {tags && tags.length > 0 ? tags.slice(0, 2).join(', ') + (tags.length > 2 ? '...' : '') : <span>No tags</span>}
        </div>
        {status === 'published' && commentCount !== undefined && commentCount > 0 && (
          <Link href={`${postLink}#comments`} className="hover:text-primary transition-colors flex items-center gap-1">
             <MessageSquareText className="h-3 w-3" />
            <span>{commentCount} Comment{commentCount === 1 ? '' : 's'}</span>
          </Link>
        )}
        <div className="flex items-center space-x-2">
          {showEditButton && (
            <Button asChild variant="outline" size="sm" className="text-xs h-auto py-1.5 px-2.5">
              <Link href={editLink}>
                <Edit className="mr-1 h-3 w-3" /> Edit
              </Link>
            </Button>
          )}
          {deleteActionSlot}
        </div>
      </div>
    </Card>
  );
}
