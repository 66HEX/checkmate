"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import { supabase } from '@/app/utils/supabaseClient';

interface Project {
    id: number;
    title: string;
    description: string;
}

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect to login page if not authenticated
    useEffect(() => {
        if (status === "loading") return; // Wait until session status is resolved
        if (!session) router.push('/'); // Redirect to login if not authenticated
    }, [session, status, router]);

    // Show the button only when authenticated
    const isAuthenticated = status === "authenticated";

    return (
        <div className="w-screen h-screen bg-lightgray flex flex-col items-center justify-center font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16">
            <h1 className="text-6xl md:text-9xl text-offwhite font-bold mt-12 mb-6 text-center">
                Welcome to <span className="text-bluecustom">CHECKMATE</span>
            </h1>
            <p className="text-lg md:text-xl text-offwhite mb-8 text-center max-w-3xl">
                CHECKMATE is your go-to tool for managing projects and tasks. Perfect for freelancers and teams who need to stay organized and productive.
            </p>
            {isAuthenticated && (
                <Link href="/projects/new">
                    <div className="relative w-full max-w-md bg-bluecustom hover:bg-bluehover text-offwhite rounded-lg shadow-lg p-4 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-xl font-bold">Start New Project</span>
                        <div className="ml-4 h-10 w-10">
                            <ArrowIcon width={40} height={40} />
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
}
