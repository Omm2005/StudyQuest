'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme = 'system', setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 px-2"
          aria-label="Toggle theme"
        >
          {/* Sun/Moon icon swap */}
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      {/* Uses shadcn tokens by default: bg-popover, text-popover-foreground, border-border */}
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">THEME</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Accessible radio group with current selection */}
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem
            value="light"
            className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
          >
            <Sun className="mr-2 h-4 w-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
          >
            <Moon className="mr-2 h-4 w-4" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
          >
            <Monitor className="mr-2 h-4 w-4" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
