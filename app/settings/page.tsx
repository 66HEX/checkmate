"use client";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import Link from "next/link";

export default function Settings() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return null;
    }

    if (!session) {
        router.push('/');
        return;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <Link href="/users">
                <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-2xl font-bold">Users</span>
                    <div className="absolute bottom-4 right-4 h-10 w-10">
                        <ArrowIcon width={40} height={40} />
                    </div>
                </div>
            </Link>

            <Link href="/teams">
                <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-2xl font-bold">Teams</span>
                    <div className="absolute bottom-4 right-4 h-10 w-10">
                        <ArrowIcon width={40} height={40} />
                    </div>
                </div>
            </Link>

            <Link href="/profile">
                <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-2xl font-bold">Profile</span>
                    <div className="absolute bottom-4 right-4 h-10 w-10">
                        <ArrowIcon width={40} height={40} />
                    </div>
                </div>
            </Link>
        </div>
    );
}
