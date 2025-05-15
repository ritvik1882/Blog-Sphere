"use client";

import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: User | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarFallback>??</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user profile" />}
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
