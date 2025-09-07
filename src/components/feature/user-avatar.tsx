"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/data";
import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
    user: User;
    className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
    return (
        <Avatar className={className}>
            <AvatarImage src={user.faceprint} alt={user.name} />
            <AvatarFallback>
                <UserIcon className="h-4 w-4" />
            </AvatarFallback>
        </Avatar>
    );
}
