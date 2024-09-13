"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Profile() {

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            // Wait until the session status is determined
            return;
        }

        // Redirect to home if user is not authenticated
        if (!session) {
            router.push('/');
        }
    }, [session, status, router]);
    return (
        <div className="h-svh w-screen flex items-center justify-center">
            <h1 className="font-JetBrainsMono text-9xl text-offwhite">Profile</h1>
        </div>
    );
}
