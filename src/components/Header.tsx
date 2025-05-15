
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { AuthButton } from '@/components/AuthButton';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center"> {/* Main flex container */}
        {/* Title with explicit left padding */}
        <Link href="/" className="flex items-center pl-4 shrink-0">
          <span className="font-bold text-lg">BlogSphere</span>
        </Link>
        
        {/* Search bar: centered and takes available space on md+ screens */}
        {/* Uses flex-grow to fill space between title and auth buttons */}
        <div className="hidden md:flex flex-grow justify-center px-2 sm:px-4"> 
          <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md"> {/* Controls search bar width */}
            <SearchBar />
          </div>
        </div>
        
        {/* Auth button group, pushed to the right */}
        <div className="flex items-center ml-auto shrink-0"> 
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
