"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const result = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password,
        });

        if (result?.error) {
            setError('Invalid email or password');
        } else if (result?.ok) {
            router.push('/');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex items-center justify-center h-svh w-screen font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-6 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-offblack">Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label htmlFor="email" className="block text-base text-darkgray mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder="example@gmail.com"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-base text-darkgray mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder="Password"
                        />
                    </div>
                    {error && <p className="text-warning text-base text-center mb-3" aria-live="polite">{error}</p>}
                    <button
                        type="submit"
                        className={`w-full mb-6 bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                    >
                        Log In
                    </button>
                </form>
                <div className="text-center">
                    <p className="text-darkgray text-base mb-1">Don&apos;t have an account?</p>
                    <Link href="/register">
                        <span className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center">
                            Create Account
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
