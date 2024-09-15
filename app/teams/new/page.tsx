"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function NewTeamForm() {
    const [teamName, setTeamName] = useState<string>(''); // State for team name
    const [teamDescription, setTeamDescription] = useState<string>(''); // State for team description
    const [teamDescriptionLength, setTeamDescriptionLength] = useState<number>(0); // State to track the length of the team description
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState<boolean>(false); // State to check if the user is a manager
    const [checkingRole, setCheckingRole] = useState<boolean>(true); // State to check role
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
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
                router.push("/"); // Redirect if not manager
            } else {
                setIsManager(true); // User is manager, allow access
            }
            setCheckingRole(false); // Role check completed
        };

        checkUserRole();
    }, [session, status, router]);

    useEffect(() => {
        setTeamDescriptionLength(teamDescription.length);
    }, [teamDescription]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamName) {
            setError('Team name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Insert new team into the 'teams' table
            const { error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: teamName,
                    description: teamDescription || null, // Description is optional
                });

            if (teamError) {
                throw teamError;
            }

            alert('Team created successfully!');
            // Reset form fields
            setTeamName('');
            setTeamDescription('');
            router.push('/teams'); // Redirect to the teams list or other page
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
        return null; // Render nothing if not manager
    }

    return (
        <div className="flex items-center justify-center min-h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create New Team</h1>
                {error && <p className="text-warning mb-3 text-center">{error}</p>}
                <form onSubmit={handleCreateTeam}>
                    <div className="mb-3">
                        <label htmlFor="teamName" className="block text-base mb-1">Team Name</label>
                        <input
                            type="text"
                            id="teamName"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder="Team name"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="teamDescription" className="block text-base mb-1">Team Description</label>
                        <div className="flex flex-col">
                            <textarea
                                id="teamDescription"
                                value={teamDescription}
                                onChange={(e) => setTeamDescription(e.target.value)}
                                className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                                placeholder="Team description (optional)"
                                maxLength={50}
                            />
                            <span className="text-right text-darkgray text-sm mt-1">
                                {50 - teamDescriptionLength} characters left
                            </span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center"
                    >
                        {loading ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    );
}
