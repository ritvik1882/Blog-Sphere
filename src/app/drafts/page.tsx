
"use client";
// This file is deprecated and functionality moved to /my-content/page.tsx
// It can be safely deleted. For now, it redirects.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedDraftsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/my-content');
  }, [router]);

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting to My Content page...</p>
    </div>
  );
}
