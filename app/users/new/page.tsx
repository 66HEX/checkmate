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
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*');

            if (teamsError) {
                console.error("Error fetching teams:", teamsError.message);
                setError(teamsError.message);
                return;
            }

            setTeams(teamsData || []);
        };

        const checkUserRole = async () => {
            if (status === "loading") return;

            if (!session) {
                router.push("/"); // Redirect if not authenticated
                return;
            }

            const userId = session?.user?.id ?? '';

            // Fetch the user's role from the profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profileError || profile?.role !== 'manager') {
                router.push("/"); // Redirect if not admin
            } else {
                setIsManager(true); // User is admin, allow access
            }
            setCheckingRole(false); // Role check completed
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

        setLoading(true);
        setError(null);

        try {
            // Rejestracja użytkownika
            const { data: user, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            if (user?.user?.id) {
                // Wstawienie rekordu profilu z ID zespołu
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.user.id,
                        email: user.user.email,
                        firstname: firstname,
                        lastname: lastname,
                        role: role, // Wybrana rola
                        team_id: team // ID zespołu, które będzie przypisane do team_id
                    });

                if (profileError) {
                    throw profileError;
                }

                alert('Registration successful!');
                // Resetowanie formularza
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
                setRole('worker'); // Reset roli do domyślnej
                setTeam(''); // Reset ID zespołu
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
        return null; // Loading state while checking role
    }

    if (!isManager) {
        return null; // Render message if not admin
    }

    return (
        <div className="flex items-center justify-center min-h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded shadow-lg">
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
