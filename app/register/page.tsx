"use client";
import React, { useState } from 'react';
import {supabase} from '@/app/utils/supabaseClient';

const RegisterPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            alert('Registration successful! Please check your email for verification.');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen text-offblack font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleRegister}>
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
                    <div className="mb-4">
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
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-bluecustom hover:bg-bluehover text-offwhite p-3 rounded transition-all shadow-lg mb-4"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <p className="text-darkgray mb-2">Already have an account?</p>
                    <a href="/login">
                        <button
                            className="w-full bg-greencustom hover:bg-greenhover text-offwhite p-3 rounded transition-all shadow-lg">
                            Log In
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
