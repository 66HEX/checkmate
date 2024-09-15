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
    team: Team | null; // Use Team object
}

interface PageProps {
    params: {
        userId: string;
    };
}

export default function UserDetailPage({ params }: PageProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editRole, setEditRole] = useState('');
    const [editFirstname, setEditFirstname] = useState('');
    const [editLastname, setEditLastname] = useState('');
    const [editTeam, setEditTeam] = useState(''); // State for editing team
    const [loading, setLoading] = useState<boolean>(true);
    const [isManager, setIsManager] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]); // State for list of teams
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = params.userId;

    // Fetch user data
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

            // Ensure team is a single object, not an array
            const userData = {
                ...data,
                team: Array.isArray(data.team) ? data.team[0] || null : data.team,
            };

            setUser(userData as User);
            setEditRole(userData.role);
            setEditFirstname(userData.firstname);
            setEditLastname(userData.lastname);
            setEditTeam(userData.team?.id ?? ''); // Set the initial value for team id
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, router]);

    // Fetch list of teams
    const fetchTeams = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('teams').select('id, name');

            if (error) {
                throw error;
            }

            setTeams(data as Team[]);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

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

                if (roleError) {
                    console.error("Error fetching user role:", roleError.message);
                    return;
                }

                const role = roleData?.role;
                if (role === 'manager') {
                    setIsManager(true);
                }
            } catch (error) {
                console.error("Error checking admin role:", error);
            }
        };

        checkManager();
        fetchTeams(); // Fetch teams when component mounts
        fetchUser();
    }, [session, status, router, fetchUser, fetchTeams]);

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editRole,
                    firstname: editFirstname,
                    lastname: editLastname,
                    team_id: editTeam || null  // Ustawienie null dla braku zespołu
                })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            setUser((prevUser) => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    role: editRole,
                    firstname: editFirstname,
                    lastname: editLastname,
                    team: teams.find(team => team.id === editTeam) ?? null  // Zaktualizowanie teamu lub ustawienie null
                };
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };


    const handleDelete = async () => {
        const confirmation = window.confirm("Are you sure you want to delete this user?");

        if (!confirmation) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/deleteUser', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error deleting user');
            }

            console.log(result.message);
            router.push("/users");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error("Error deleting user:", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'manager':
                return 'Project Manager';
            case 'leader':
                return 'Team Leader';
            case 'worker':
                return 'Worker';
            default:
                return 'Unknown';
        }
    };

    if (status === "loading" || loading || user === null) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">User ID: <span className="font-medium text-base">{user.id}</span></p>
                {isEditing ? (
                    <>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">First Name</label>
                            <input
                                type="text"
                                value={editFirstname}
                                onChange={(e) => setEditFirstname(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Last Name</label>
                            <input
                                type="text"
                                value={editLastname}
                                onChange={(e) => setEditLastname(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">User Role</label>
                            <div className="relative">
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                                >
                                    <option value="manager">Project Manager</option>
                                    <option value="leader">Team Leader</option>
                                    <option value="worker">Worker</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Team</label>
                            <select
                                value={editTeam}
                                onChange={(e) => setEditTeam(e.target.value)}
                                className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                            >
                                <option value="">No team</option>
                                {/* Opcja dla braku przypisanego teamu */}
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
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
                            onClick={() => setIsEditing(false)}
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
                        <p className="text-lg mb-3">Team: {user.team?.name || 'No team assigned'}</p>
                        <p className="text-lg mb-3">Role: {getRoleDisplayName(user.role)}</p>
                        <p className="text-lg mb-6">Email: {user.email}</p>
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
                    </>
                )}
            </div>
        </div>
    );
}
