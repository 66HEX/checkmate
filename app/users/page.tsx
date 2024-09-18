"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import Link from "next/link";

interface Team {
    id: string;
    name: string;
}

interface UserProfile {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    team: Team | null;
}

export default function UsersList() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState(false);

    const fetchUserRole = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const { data: roleData, error: roleError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (roleError) throw roleError;

            if (roleData?.role === 'manager') {
                setIsManager(true);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            setError("Error fetching user role.");
        }
    }, [session]);

    const fetchUsers = useCallback(async () => {
        try {
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select(`id, email, firstname, lastname, role, team:team_id (id, name)`)
                .neq('id', session?.user?.id);

            if (usersError) throw usersError;

            const formattedUsersData = usersData.map(user => ({
                ...user,
                team: Array.isArray(user.team) ? user.team[0] || null : user.team
            }));

            setUsers(formattedUsersData || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Error fetching users.");
        }
    }, [session]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/");
            return;
        }

        fetchUserRole();
        fetchUsers().finally(() => setLoading(false));
    }, [session, status, router, fetchUserRole, fetchUsers]);

    const handleUserClick = (userId: string) => {
        router.push(`/users/${userId}`);
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

    if (loading) return null;;

    if (error) return null;;

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            {isManager && (
                <Link href="/users/new">
                    <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-2xl font-bold">Add New User</span>
                        <div className="absolute bottom-4 right-4 h-10 w-10">
                            <ArrowIcon width={40} height={40} />
                        </div>
                    </div>
                </Link>
            )}

            {users.length > 0 ? (
                users.map(user => (
                    <div
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-6">{user.firstname} {user.lastname}</h3>
                        </div>
                        <div>
                            <p className="text-base text-darkgray mb-1">
                                Role: {getRoleDisplayName(user.role)}
                            </p>
                            <p className="text-base text-darkgray mb-1">
                                Team: {user.team?.name || 'No team assigned'}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p>No users available.</p>
            )}
        </div>
    );
}
