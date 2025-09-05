'use client';

import * as React from 'react';
import Link from 'next/link';
import { redirect, usePathname } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { ThemeToggle } from '@/components/Navbar/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import SignOutOption from '@/server/auth/SignOutOption';

type UserInfo = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NavbarProps = {
  user?: UserInfo;
  // onSignOut?: () => void;
};

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const initials =
    (user?.name || user?.email || 'SQ')
      .split(' ')
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'SQ';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground"
            aria-label="StoryQuest Home"
          >
            <span className="inline-block h-2 w-2 rounded-sm border border-border" />
            <span className="font-mono text-sm font-semibold tracking-[0.2em]">
              STORYQUEST
            </span>
            <Badge
              variant="outline"
              className="ml-1 text-[10px] tracking-widest text-muted-foreground"
            >
              MONO
            </Badge>
          </Link>
        </div>

        {/* Right: Theme + Profile + Mobile Menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7">
                  {user?.image ? (
                    <AvatarImage src={user.image} alt={user?.name || 'User avatar'} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {user?.name || user?.email || 'Guest'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async() => {
                  await SignOutOption()
                  redirect("/login");
                }}
                className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
