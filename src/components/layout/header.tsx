"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/icons/logo";
import { MobileNav } from "./mobile-nav";

interface HeaderProps {
    title: string;
    navItems: {
        href: string;
        label: string;
        icon: string;
    }[];
}

export function Header({ title, navItems }: HeaderProps) {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const constructHref = (baseHref: string) => {
    // Only add userId if it exists. This prevents "?userId=" with an empty value.
    // The dashboard link from login page will establish the initial userId.
    if (userId) {
        const params = new URLSearchParams();
        params.set('userId', userId);
        return `${baseHref}?${params.toString()}`;
    }
    return baseHref;
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">
              FaceCheck
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             {navItems.map((item) => (
                <Link key={item.href} href={constructHref(item.href)} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {item.label}
                </Link>
             ))}
          </nav>
        </div>
        
        <MobileNav title={title} navItems={navItems} />

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
             <h1 className="text-lg font-bold font-headline text-center md:text-left">{title}</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
