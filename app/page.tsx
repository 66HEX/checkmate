"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import { supabase } from '@/app/utils/supabaseClient';

export default function Home() {
    const { data: session, status } = useSession();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (status === "loading") return;

            if (!session) {
                setUserRole(null);
                setLoading(false);
                return;
            }

            // Fetch the role of the user from the profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error.message);
                setUserRole(null);
            } else {
                setUserRole(data?.role || null);
            }

            setLoading(false);
        };

        fetchUserRole();
    }, [session, status]);

    const isAdmin = userRole === 'admin';

    // Return a loading spinner or nothing while loading
    if (status === "loading" || loading) {
        return null;
    }

    return (
        <div className="w-screen h-svh flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <h1 className="text-6xl md:text-9xl text-offwhite font-bold mb-6 text-center">
                Welcome to <span className="text-offblack">CHECKMATE</span>
            </h1>
            <p className="text-lg md:text-xl text-offwhite mb-8 text-center max-w-3xl">
                CHECKMATE is your go-to tool for managing projects and tasks. Perfect for freelancers who need to stay organized and productive.
            </p>
            {isAdmin && (
                <Link href="/projects/new">
                    <div className="relative w-full max-w-md bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-4 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-xl font-bold">Start New Project</span>
                        <div className="ml-4 h-8 w-8">
                            <ArrowIcon width={30} height={30} />
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
}
