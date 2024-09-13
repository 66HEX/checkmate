"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import logo from '@/public/checkmate.svg';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <nav className="w-64 bg-offwhite text-offblack flex flex-col justify-between p-6 h-screen font-JetBrainsMono shadow-lg fixed top-0 left-0">
            <div>
                {/* Logo */}
                <div className="mb-8 ">
                    <Image
                        src={logo}
                        alt="Checkmate Logo"
                        width={80}
                        height={80}
                        className="mx-auto"
                    />
                </div>

                <ul className="space-y-6">
                    <li>
                        <Link href="/" className={`p-3 block rounded transition-colors ${pathname === '/' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link href="/tasks" className={`p-3 block rounded transition-colors ${pathname === '/tasks' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                            Tasks
                        </Link>
                    </li>
                    <li>
                        <Link href="/completed" className={`p-3 block rounded transition-colors ${pathname === '/completed' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                            Completed
                        </Link>
                    </li>
                    <li>
                        <Link href="/profile" className={`p-3 block rounded transition-colors ${pathname === '/profile' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                            Profile
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Button to go to the login panel */}
            <div className="mt-8">
                <Link href="/login">
                    <button className="w-full bg-bluecustom hover:bg-bluehover text-offwhite p-3 rounded transition-all shadow-lg">
                        Log In
                    </button>
                </Link>
            </div>
        </nav>
    );
}
