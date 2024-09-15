"use client"
import React, { useState } from 'react';
import { supabase } from '@/app/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [firstname, setFirstName] = useState<string>('');
    const [lastname, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: user, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            if (user?.user?.id) {
                // Insert profile record
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.user.id,
                        email: user.user.email,
                        firstname: firstname,
                        lastname: lastname,
                        role: 'worker',
                    });

                if (profileError) {
                    throw profileError;
                }

                alert('Registration successful! Please check your email for verification.');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
                router.push('/login');
            } else {
                throw new Error('User registration failed: No user ID returned.');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                {error && <p className="text-warning mb-3 text-center">{error}</p>}
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label htmlFor="firstName" className="block text-base mb-1">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstname}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`John`}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="lastName" className="block text-base mb-1">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastname}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`Doe`}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="block text-base mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`example@gmail.com`}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="block text-base mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`Password`}
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-base mb-1">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`Confirm Password`}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-darkgray text-base mb-1">Already have an account?</p>
                    <Link href="/login">
                        <button
                            className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center"
                        >
                            Log In
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
