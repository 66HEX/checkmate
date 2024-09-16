"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

interface Member {
    id: string;
    firstname: string;
    lastname: string;
    role: 'manager' | 'leader' | 'worker'; // Add role types
}

export default function NewTeamForm() {
    const [teamName, setTeamName] = useState<string>(''); // State for team name
    const [teamDescription, setTeamDescription] = useState<string>(''); // State for team description
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState<boolean>(false); // State to check if the user is a manager
    const [checkingRole, setCheckingRole] = useState<boolean>(true); // State to check role
    const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]); // State for unassigned members
    const [selectedMemberId, setSelectedMemberId] = useState<string>(''); // State for selected member
    const [addedMembers, setAddedMembers] = useState<Member[]>([]); // State for added members
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const checkUserRole = async () => {
            if (status === "loading") return;

            if (!session) {
                router.push("/");
                return;
            }

            const userId = session?.user?.id ?? '';

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
            setCheckingRole(false);
        };

        checkUserRole();
    }, [session, status, router]);

    const fetchUnassignedMembers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, firstname, lastname, role')
                .is('team_id', null);

            if (error) {
                console.error('Error fetching unassigned members:', error);
                return;
            }

            setUnassignedMembers(data);
        } catch (error) {
            console.error('Error fetching unassigned members:', error);
        }
    }, []);


    useEffect(() => {
        fetchUnassignedMembers();
    }, [fetchUnassignedMembers]);

    const handleAddMember = () => {
        const selectedMember = unassignedMembers.find((member) => member.id === selectedMemberId);
        if (selectedMember && !addedMembers.some((member) => member.id === selectedMember.id)) {
            setAddedMembers([...addedMembers, selectedMember]);

            setUnassignedMembers(unassignedMembers.filter((member) => member.id !== selectedMemberId));

            setSelectedMemberId('');
        }
    };

    const handleRemoveMember = (memberId: string) => {
        setAddedMembers(addedMembers.filter((member) => member.id !== memberId));
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamName) {
            setError('Team name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: teamName,
                    description: teamDescription || null,
                })
                .select()
                .single();

            if (teamError) {
                throw teamError;
            }

            for (const member of addedMembers) {
                const { error: memberError } = await supabase
                    .from('profiles')
                    .update({ team_id: team.id })
                    .eq('id', member.id);

                if (memberError) {
                    throw memberError;
                }
            }

            alert('Team created successfully!');
            // Reset form fields
            setTeamName('');
            setTeamDescription('');
            setAddedMembers([]);
            router.push('/teams');
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

    const getRoleDisplayName = (role: 'manager' | 'leader' | 'worker'): string => {
        switch (role) {
            case 'worker':
                return 'Worker';
            case 'leader':
                return 'Team Leader';
            case 'manager':
                return 'Project Manager';
            default:
                return 'Unknown Role';
        }
    };

    if (status === "loading" || checkingRole) {
        return null;
    }

    if (!isManager) {
        return null;
    }

    return (
        <div className="flex  justify-center min-h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-xl p-6 bg-offwhite rounded shadow-lg mt-16 md:mt-0">
                <h1 className="text-2xl font-bold mb-6 text-center">Create New Team</h1>
                {error && <p className="text-warning mb-3 text-center">{error}</p>}
                <form onSubmit={handleCreateTeam}>
                    <div className="mb-3">
                        <label htmlFor="teamName" className="block text-base mb-1">Team Name</label>
                        <div className="flex flex-col">
                            <input
                                type="text"
                                id="teamName"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                                placeholder="Team Name"
                                maxLength={50}
                            />
                            <span className="text-right text-darkgray text-sm mt-1">
                                {50 - teamName.length} characters left
                            </span>
                        </div>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="teamDescription" className="block text-base mb-1">Team Description</label>
                        <div className="flex flex-col">
                            <textarea
                                id="teamDescription"
                                value={teamDescription}
                                onChange={(e) => setTeamDescription(e.target.value)}
                                className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                                placeholder="Team Description"
                                maxLength={500}
                                rows={4}
                            />
                            <span className="text-right text-darkgray text-sm mt-1">
                                {500 - teamDescription.length} characters left
                            </span>
                        </div>
                    </div>

                    {addedMembers.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-base mb-1">Team Members</h2>
                            <ul className="space-y-3">
                                {addedMembers.map((member) => (
                                    <li key={member.id} className="flex justify-between items-center">
                                        <div className="flex-1 p-2 border border-darkgray rounded flex items-center">
                                            <span className="flex-grow">{member.firstname} {member.lastname}</span>
                                            <span
                                                className="text-sm text-darkgray">{getRoleDisplayName(member.role)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="bg-offblack hover:bg-darkgray text-offwhite p-2 rounded ml-2"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mb-3">
                        <label htmlFor="teamMembers" className="block text-base mb-1">Add Member</label>
                        <select
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                        >
                            <option value="">Select a member</option>
                            {unassignedMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.firstname} {member.lastname} - {getRoleDisplayName(member.role)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddMember}
                            className="bg-offblack hover:bg-darkgray text-offwhite p-2 mt-6 text-base rounded transition-all shadow-lg w-full"
                        >
                            Add Member
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg"
                    >
                        {loading ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    );
}
