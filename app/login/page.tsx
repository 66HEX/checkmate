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
            router.push('/');
        }
    };

    return (
        <div className="flex items-center justify-center h-svh w-screen font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-offblack">Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-base mb-2 text-darkgray">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 text-offblack bg-lightgray rounded focus:outline-none text-base"
                            placeholder={`example@gmail.com`}
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-base mb-2 text-darkgray ">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 text-offblack bg-lightgray rounded focus:outline-none text-base"
                            placeholder={`Password`}
                        />
                    </div>
                    {error && <p className="text-warning text-base text-center mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-brand hover:bg-brandhover text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center"
                    >
                        Log In
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-darkgray text-base mb-2">Don&apos;t have an account?</p>
                    <Link href="/register">
                        <button className="w-full bg-success hover:bg-successhover text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center">
                            Create Account
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
