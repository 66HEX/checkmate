"use client";

import { useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";


export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push('/');
    }, [session, status, router]);

    const isAuthenticated = status === "authenticated";

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <h1 className="text-6xl md:text-9xl text-offwhite font-bold  mb-6 text-center">
                Welcome to <span className="text-brand">CHECKMATE</span>
            </h1>
            <p className="text-lg md:text-xl text-offwhite mb-8 text-center max-w-3xl">
                CHECKMATE is your go-to tool for managing projects and tasks. Perfect for freelancers who need to stay organized and productive.
            </p>
            {isAuthenticated && (
                <Link href="/projects/new">
                    <div className="relative w-full max-w-md bg-brand hover:bg-brandhover text-offwhite rounded shadow-lg p-4 flex items-center justify-center cursor-pointer transition-all">
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
