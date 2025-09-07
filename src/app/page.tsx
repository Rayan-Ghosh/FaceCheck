
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, UserCheck, Users } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export default function Home() {
  const portals = [
    {
      role: 'Student',
      description: 'Mark your attendance.',
      href: '/login/user',
      icon: <UserCheck className="h-8 w-8 text-primary" />,
    },
    {
      role: 'Teacher',
      description: 'View class records.',
      href: '/login/user',
      icon: <Users className="h-8 w-8 text-primary" />,
    },
    {
      role: 'Administrator',
      description: 'Manage users & classes.',
      href: '/login/admin',
      icon: <Lock className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <header className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <Logo className="h-20 w-20" />
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to FaceCheck
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your smart attendance solution.
        </p>
      </header>
      <main>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {portals.map((portal) => (
            <Card
              key={portal.role}
              className="w-full max-w-sm transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-2xl font-bold">
                  {portal.role} Portal
                </CardTitle>
                {portal.icon}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{portal.description}</p>
                <Button asChild className="mt-4 w-full bg-primary hover:bg-primary/90">
                  <Link href={portal.href}>
                    Go to Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FaceCheck. All rights reserved.</p>
      </footer>
    </div>
  );
}
