"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";

interface Team {
    id: string;
    name: string;
}

interface User {
    id: string;
    email: string;
    role: string;
    firstname: string;
    lastname: string;
    team: Team | null;
}

interface PageProps {
    params: {
        userId: string;
    };
}

export default function UserDetailPage({ params }: PageProps) {
    const [user, setUser] = useState<User | null>(null);
    const [editState, setEditState] = useState({
        role: '',
        firstname: '',
        lastname: '',
        team: ''
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [isManager, setIsManager] = useState<boolean>(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = params.userId;

    const fetchUser = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role, firstname, lastname, team:team_id (id, name)')
                .eq('id', userId)
                .single();

            if (error || !data) {
                router.push("/404");
                return;
            }

            const team = Array.isArray(data.team) ? data.team[0] : data.team;

            setUser({
                id: data.id,
                email: data.email,
                role: data.role,
                firstname: data.firstname,
                lastname: data.lastname,
                team: team || null
            });

            setEditState({
                role: data.role,
                firstname: data.firstname,
                lastname: data.lastname,
                team: team?.id ?? ''
            });

        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, router]);


    const fetchTeams = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('teams').select('id, name');

            if (error) throw error;

            setTeams(data as Team[]);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/");
            return;
        }

        const checkManager = async () => {
            try {
                const userId = session?.user?.id ?? '';
                const { data: roleData, error: roleError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (roleError || roleData?.role !== 'manager') {
                    router.push("/");
                } else {
                    setIsManager(true);
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
            }
        };

        checkManager();
        fetchTeams();
        fetchUser();
    }, [session, status, router, fetchUser, fetchTeams]);

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editState.role,
                    firstname: editState.firstname,
                    lastname: editState.lastname,
                    team_id: editState.team || null
                })
                .eq('id', userId);

            if (error) throw error;

            setUser(prevUser => prevUser ? {
                ...prevUser,
                role: editState.role,
                firstname: editState.firstname,
                lastname: editState.lastname,
                team: teams.find(team => team.id === editState.team) ?? null
            } : null);
            setEditState(prev => ({ ...prev, team: editState.team }));
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        setLoading(true);

        try {
            const response = await fetch('/api/deleteUser', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error deleting user');

            router.push("/users");
        } catch (error) {
            console.error("Error deleting user:", error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setEditState({
            role: user?.role ?? '',
            firstname: user?.firstname ?? '',
            lastname: user?.lastname ?? '',
            team: user?.team?.id ?? ''
        });
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'manager': return 'Project Manager';
            case 'leader': return 'Team Leader';
            case 'worker': return 'Worker';
            default: return 'Unknown';
        }
    };

    if (status === "loading" || loading) {
        return null;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">User ID: <span className="font-medium text-base">{user.id}</span></p>
                {editState ? (
                    <>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">First Name</label>
                            <input
                                type="text"
                                value={editState.firstname}
                                onChange={(e) => setEditState(prev => ({ ...prev, firstname: e.target.value }))}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Last Name</label>
                            <input
                                type="text"
                                value={editState.lastname}
                                onChange={(e) => setEditState(prev => ({ ...prev, lastname: e.target.value }))}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">User Role</label>
                            <select
                                value={editState.role}
                                onChange={(e) => setEditState(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                            >
                                <option value="manager">Project Manager</option>
                                <option value="leader">Team Leader</option>
                                <option value="worker">Worker</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Team</label>
                            <select
                                value={editState.team}
                                onChange={(e) => setEditState(prev => ({ ...prev, team: e.target.value }))}
                                className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                            >
                                <option value="">No team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSave}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mb-3"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold mb-6">
                            {user.firstname} {user.lastname}
                        </h1>
                        <p className="text-base mb-3">Role: {getRoleDisplayName(user.role)}</p>
                        <p className="text-base mb-3">Team: {user.team?.name || 'No team assigned'}</p>
                        <p className="text-base mb-6">Email: {user.email}</p>
                        {isManager && (
                            <>
                                <button
                                    onClick={() => setEditState({
                                        role: user.role,
                                        firstname: user.firstname,
                                        lastname: user.lastname,
                                        team: user.team?.id ?? ''
                                    })}
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
                    </>
                )}
            </div>
        </div>
    );
}
