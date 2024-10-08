"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function NewUserForm() {
    const [firstname, setFirstName] = useState<string>('');
    const [lastname, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [role, setRole] = useState<string>('worker'); // State for role selection
    const [team, setTeam] = useState<string>(''); // State for team
    const [teams, setTeams] = useState<{ id: string, name: string }[]>([]); // State for teams
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState<boolean>(false); // State to track if the user is admin
    const [checkingRole, setCheckingRole] = useState<boolean>(true); // State to track role check
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*');

                if (teamsError) {
                    console.error("Error fetching teams:", teamsError.message);
                    setError(teamsError.message);
                } else {
                    setTeams(teamsData || []);
                }
            } catch (error) {
                console.error("Unexpected error fetching teams:", error);
                setError('An unexpected error occurred while fetching teams.');
            }
        };

        const checkUserRole = async () => {
            if (status === "loading") return;

            if (!session) {
                router.push("/");
                return;
            }

            const userId = session?.user?.id ?? '';

            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (profileError || profile?.role !== 'manager') {
                    router.push("/");
                } else {
                    setIsManager(true);
                }
            } catch (error) {
                console.error("Unexpected error checking user role:", error);
                setError('An unexpected error occurred while checking user role.');
                router.push("/");
            } finally {
                setCheckingRole(false);
            }
        };

        fetchTeams();
        checkUserRole();
    }, [session, status, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password should be at least 6 characters long');
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
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.user.id,
                        email: user.user.email,
                        firstname: firstname,
                        lastname: lastname,
                        role: role,
                        team_id: team
                    });

                if (profileError) {
                    throw profileError;
                }

                alert('Registration successful!');
                // Reset form fields
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
                setRole('worker');
                setTeam('');
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

    if (status === "loading" || checkingRole) {
        return null;
    }

    if (!isManager) {
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-xl p-6 bg-offwhite rounded shadow-lg mt-16 md:mt-0">
                <h1 className="text-2xl font-bold mb-6 text-center">Register New User</h1>
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
                        <label htmlFor="role" className="block text-base mb-1">Role</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                        >
                            <option value="manager">Project Manager</option>
                            <option value="leader">Team Leader</option>
                            <option value="worker">Worker</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="team" className="block text-base mb-1">Team</label>
                        <select
                            id="team"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                        >
                            <option value="">Select a team</option>
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
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
                        {loading ? 'Registering...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
}
