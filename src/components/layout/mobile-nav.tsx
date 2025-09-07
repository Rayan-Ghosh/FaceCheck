"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, LayoutDashboard, UserPlus, BookCopy, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";


const iconMap: { [key: string]: React.ElementType } = {
    LayoutDashboard,
    UserPlus,
    BookCopy,
    CalendarCheck,
};

interface MobileNavProps {
    title: string;
    navItems: {
        href: string;
        label: string;
        icon: string;
    }[];
}

export function MobileNav({ title, navItems }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const constructHref = (baseHref: string) => {
        if (userId) {
            const params = new URLSearchParams();
            params.set('userId', userId);
            return `${baseHref}?${params.toString()}`;
        }
        return baseHref;
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 w-3/4 flex flex-col">
                <SheetTitle>
                  <VisuallyHidden>Navigation Menu</VisuallyHidden>
                </SheetTitle>
                <Link
                    href="/"
                    className="mb-4 flex items-center"
                    onClick={() => setOpen(false)}
                >
                    <Logo className="mr-2 h-8 w-8" />
                    <span className="font-bold font-headline">FaceCheck</span>
                </Link>
                <div className="flex flex-col flex-grow">
                    <nav className="flex-grow space-y-2">
                        {navItems.map((item) => {
                            const Icon = iconMap[item.icon];
                            return (
                                <Link
                                    key={item.href}
                                    href={constructHref(item.href)}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 rounded-l-md p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    {Icon && <Icon className="h-5 w-5" />}
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                     <div className="mt-auto">
                         <Link
                            href="/"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-l-md p-3 text-muted-foreground hover:bg-destructive/80 hover:text-destructive-foreground"
                         >
                            <LogOut className="h-5 w-5" />
                             Logout
                         </Link>
                     </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
