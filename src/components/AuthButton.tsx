
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Edit3, FileText, PlusCircle, LayoutGrid } from "lucide-react"; 
import { Skeleton } from "@/components/ui/skeleton";

export function AuthButton() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/create-post">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Post
          </Link>
        </Button>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/my-content"> 
            <LayoutGrid className="mr-2 h-4 w-4" /> My Content 
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <UserAvatar user={user} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="sm:hidden">
              <Link href="/create-post">
                {/* Wrap icon and text in a span for robust handling by Slot */}
                <span className="flex items-center gap-2 w-full">
                  <PlusCircle className="h-4 w-4" /> Create Post
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="sm:hidden"> 
              <Link href="/my-content">
                {/* Wrap icon and text in a span */}
                <span className="flex items-center gap-2 w-full">
                  <LayoutGrid className="h-4 w-4" /> My Content
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" /> {/* Separator for mobile only items */}
            <DropdownMenuItem asChild>
              <Link href="/profile">
                {/* Wrap icon and text in a span */}
                <span className="flex items-center gap-2 w-full">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              {/* This item does not use asChild, default rendering applies */}
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button asChild variant="outline">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
}

