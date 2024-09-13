"use client";
import React, { useState } from 'react';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        console.log('Registering with:', { email, password });
    };

    return (
        <div className="flex items-center justify-center h-screen text-offblack font-JetBrainsMono">
            <div className="w-full max-w-md p-8 bg-offwhite rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-darkgray rounded"
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
                            className="w-full p-2 bg-offwhite text-offblack border border-darkgray rounded"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm
                            Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-darkgray rounded"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-bluecustom hover:bg-bluehover text-offwhite p-3 rounded transition-all shadow-lg mb-4"
                    >
                        Register
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
