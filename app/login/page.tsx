"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError('Invalid email or password');
        } else if (result?.ok) {
            router.push('/'); // Możesz zmienić ten adres na odpowiedni
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen text-offblack font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded-lg shadow-lg relative">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        />
                    </div>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-bluecustom hover:bg-bluehover text-offwhite p-3 rounded transition-all shadow-lg mb-4"
                    >
                        Log In
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-darkgray mb-2">Don&apos;t have an account?</p>
                    <Link href="/register">
                        <button className="w-full bg-greencustom hover:bg-greenhover text-offwhite p-3 rounded transition-all shadow-lg">
                            Create Account
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
