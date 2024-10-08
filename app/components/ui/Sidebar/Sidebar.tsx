"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import logo from '@/public/checkmate.svg';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const sidebarRef = useRef<HTMLDivElement>(null); // Ref for the sidebar
    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                closeSidebar();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-3 bg-offblack text-offwhite rounded-lg shadow-lg xl:hidden"
            >
                {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>

            <nav
                ref={sidebarRef}
                className={`fixed top-0 left-0 z-40 w-72 bg-offwhite text-offblack flex flex-col justify-between p-4 min-h-svh h-full font-NeueMontreal shadow-lg transition-transform duration-300 xl:fixed xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:block`}
            >
                <div className="flex flex-col flex-grow h-full justify-between">
                    <div>
                        {/* Logo */}
                        <div className="mb-3 flex justify-center">
                            <Image
                                src={logo}
                                alt="Checkmate Logo"
                                width={80}
                                height={80}
                                className="mx-auto"
                            />
                        </div>

                        <div className="mb-6">
                            <h1 className="font-black uppercase text-3xl text-center">CHECKMATE</h1>
                        </div>

                        <ul className="space-y-2">
                            <li>
                                <Link href="/" onClick={closeSidebar} className={`p-2 block rounded transition-colors text-lg ${pathname === '/' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                                    Home
                                </Link>
                            </li>

                            {session && (
                                <>
                                    <li>
                                        <Link href="/projects" onClick={closeSidebar}
                                              className={`p-2 block rounded transition-colors text-lg ${pathname === '/projects' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                                            Projects
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/completed" onClick={closeSidebar}
                                              className={`p-2 block rounded transition-colors text-lg ${pathname === '/completed' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                                            Completed
                                        </Link>
                                    </li>



                                    <li>
                                        <Link href="/settings" onClick={closeSidebar}
                                              className={`p-2 block rounded transition-colors text-lg ${pathname === '/settings' ? 'bg-lightgray text-offblack' : 'text-darkgray hover:bg-lightgray'}`}>
                                            Settings
                                        </Link>
                                    </li>

                                </>
                            )}
                        </ul>
                    </div>

                    <div className="mt-8">
                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 rounded transition-all shadow-lg flex items-center justify-between text-lg"
                            >
                                <span>Log Out</span>
                                <ArrowIcon className="h-6 w-6"/>
                            </button>
                        ) : (
                            <Link href="/login" onClick={closeSidebar}>
                                <button
                                    className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 rounded transition-all shadow-lg flex items-center justify-between text-lg"
                                >
                                    <span>Log In</span>
                                    <ArrowIcon className="h-6 w-6"/>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
