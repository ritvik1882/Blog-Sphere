"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="search"
        placeholder="Search posts, tags, users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow"
        aria-label="Search"
      />
      <Button type="submit" size="icon" variant="outline" aria-label="Submit search">
        <SearchIcon className="h-4 w-4" />
      </Button>
    </form>
  );
}
