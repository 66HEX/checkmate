"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';

interface Member {
    id: string;
    firstname: string;
    lastname: string;
    role: string;
}

interface Team {
    id: string;
    name: string;
    description: string;
    created_at: string;
    members: Member[];
    leader_email: string | null;
}

interface PageProps {
    params: {
        id: string;
    };
}

const rolePriority = {
    manager: 1,
    leader: 2,
    worker: 3
};

const sortMembersByRole = (members: Member[]) => {
    return [...members].sort((a, b) => rolePriority[a.role] - rolePriority[b.role]);
};

export default function TeamDetailPage({ params }: PageProps) {
    const [team, setTeam] = useState<Team | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const { data: session, status } = useSession();
    const router = useRouter();
    const teamId = params.id;

    const fetchTeam = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
                    id, 
                    name, 
                    description, 
                    created_at, 
                    profiles!profiles_team_id_fkey(id, firstname, lastname, role), 
                    leader_id
                `)
                .eq('id', teamId)
                .single();

            if (error || !data) {
                console.error('Error fetching team:', error);
                router.push('/404');
                return;
            }

            const { data: leaderData, error: leaderError } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', data.leader_id)
                .single();

            if (leaderError) {
                console.error('Error fetching leader email:', leaderError);
            }

            const teamData: Team = {
                id: data.id,
                name: data.name,
                description: data.description,
                created_at: data.created_at,
                members: sortMembersByRole(data.profiles.map((profile: any) => ({
                    id: profile.id,
                    firstname: profile.firstname,
                    lastname: profile.lastname,
                    role: profile.role
                }))) || [],
                leader_email: leaderData?.email || null
            };

            setTeam(teamData);
            setEditName(data.name);
            setEditDescription(data.description);

        } catch (error) {
            console.error('Unexpected error while fetching team:', error);
        }
    }, [teamId, router]);

    const fetchUserRole = useCallback(async () => {
        try {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return;
            }

            setUserRole(data?.role || null);
        } catch (error) {
            console.error('Error fetching user role:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

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

            const unassignedMembersData: Member[] = sortMembersByRole(data.map((profile: any) => ({
                id: profile.id,
                firstname: profile.firstname,
                lastname: profile.lastname,
                role: profile.role // Use actual role from database
            })));

            setUnassignedMembers(unassignedMembersData);
        } catch (error) {
            console.error('Error fetching unassigned members:', error);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchTeam();
        fetchUserRole();
        fetchUnassignedMembers();
    }, [session, status, router, fetchTeam, fetchUserRole, fetchUnassignedMembers]);

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('teams')
                .update({ name: editName, description: editDescription })
                .eq('id', teamId);

            if (error) {
                throw error;
            }

            setIsEditing(false);
            fetchTeam();
        } catch (error) {
            console.error('Error updating team:', error);
        }
    };

    const handleDelete = async () => {
        const confirmation = window.confirm("Are you sure you want to delete this team?");

        if (!confirmation) {
            return;
        }

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (error) {
                throw error;
            }

            router.push('/teams');
        } catch (error) {
            console.error('Error deleting team:', error);
        }
    };

    const handleRemoveFromTeam = async (memberId: string) => {
        const confirmation = window.confirm("Are you sure you want to remove this member from the team?");

        if (!confirmation) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ team_id: null })
                .eq('id', memberId);

            if (error) {
                throw error;
            }

            setTeam(prev => {
                if (!prev) return null;
                const updatedMembers = prev.members.filter(member => member.id !== memberId);
                return {
                    ...prev,
                    members: updatedMembers,
                };
            });

            // Re-fetch unassigned members to update the list
            fetchUnassignedMembers();
        } catch (error) {
            console.error('Error removing member from team:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedMemberId) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ team_id: teamId })
                .eq('id', selectedMemberId);

            if (error) {
                throw error;
            }

            setTeam(prev => {
                if (!prev) return null;
                const addedMember = unassignedMembers.find(member => member.id === selectedMemberId);
                if (!addedMember) return prev;
                return {
                    ...prev,
                    members: sortMembersByRole([...prev.members, addedMember])
                };
            });

            // Remove the added member from the unassigned list
            setUnassignedMembers(prev => sortMembersByRole(prev.filter(member => member.id !== selectedMemberId)));
            setSelectedMemberId('');
        } catch (error) {
            console.error('Error adding member to team:', error);
        }
    };

    const getRoleDisplayName = (role: string) => {
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

    if (status === "loading" || loading || team === null) {
        return null;
    }

    const isManager = userRole === 'manager';

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">Team Leader&apos;s Email: <span className="font-medium text-base">{team.leader_email}</span></p>

                {isEditing ? (
                    <>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Team Name</label>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                    maxLength={50}
                                />
                                <span className="text-right text-darkgray text-sm">
                                    {50 - editName.length} characters left
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">Team Description</label>
                            <div className="flex flex-col">
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                    rows={2}
                                    maxLength={500}
                                />
                                <span className="text-right text-darkgray text-sm">
                                    {500 - editDescription.length} characters left
                                </span>
                            </div>
                        </div>

                        <h2 className="text-darkgray text-base mb-3">Team Members</h2>
                        {team.members.length > 0 ? (
                            <ul className="space-y-4">
                                {team.members.map((member) => (
                                    <li key={member.id} className="flex flex-row items-center mb-3">
                                        <div className="flex-1 p-2 bg-lightgray rounded flex items-center">
                                            <span className="flex-grow">{member.firstname} {member.lastname}</span>
                                            <span
                                                className="text-sm text-darkgray">{getRoleDisplayName(member.role)}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromTeam(member.id)}
                                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded ml-2"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-lg">No members found for this team.</p>
                        )}

                        <div className="mb-3 mt-6">
                            <label className="block text-darkgray text-base mb-1">Add Member</label>
                            <select
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="w-full p-2 mb-2 border border-darkgray focus:outline-none rounded text-base"
                            >
                                <option value="">Select a member</option>
                                {unassignedMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.firstname} {member.lastname} - {getRoleDisplayName(member.role)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAddMember}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mt-3"
                        >
                            Add Member
                        </button>

                        <button
                            onClick={handleSave}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mt-3 mb-3"
                        >
                            Save Team
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold mb-3">{team.name}</h1>
                        <p className="text-lg mb-6">{team.description}</p>
                        {isManager && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-3"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-6"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        <h2 className="text-2xl font-semibold mb-3">Team Members</h2>
                        {team.members.length > 0 ? (
                            <ul className="space-y-4">
                                {team.members.map((member) => (
                                    <li key={member.id} className="p-2 text-lg bg-lightgray rounded flex justify-between items-center">
                                        <span>{member.firstname} {member.lastname}</span>
                                        <span className="text-sm text-darkgray">{getRoleDisplayName(member.role)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-lg">No members found for this team.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
