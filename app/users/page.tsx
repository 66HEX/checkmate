"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";

interface UserProfile {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
}

export default function UsersList() {
    const { data: session, status } = useSession() as { data: Session | null; status: string };
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/"); // Redirect to the home or login page if not authenticated
            return;
        }

        const fetchRoleAndUsers = async () => {
            try {
                const userId = session?.user?.id ?? '';

                const { data: roleData, error: roleError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (roleError) {
                    console.error("Error fetching user role:", roleError.message);
                    router.push("/"); // Redirect if error occurs
                    return;
                }

                const role = roleData?.role;
                if (role !== 'admin') {
                    router.push("/");
                    return;
                }

                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select('id, email, firstname, lastname, role') // Fetch role along with other fields
                    .neq('id', userId);

                if (usersError) {
                    console.error("Error fetching users:", usersError.message);
                    setError(usersError.message);
                } else {
                    setUsers(usersData || []);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                setError("Unexpected error occurred.");
            } finally {
                setLoading(false); // Set loading to false once data is fetched
            }
        };

        fetchRoleAndUsers();
    }, [session, status, router]);

    const handleUserClick = (userId: string) => {
        router.push(`/users/${userId}`); // Redirect to user details page
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Admin';
            case 'worker':
                return 'Worker';
            default:
                return 'Unknown';
        }
    };

    // Display loading and error states
    if (loading || error) {
        return null; // Render nothing if loading or error occurs
    }

    return (
        <div className="flex flex-col items-center justify-start h-screen w-full text-offblack font-NeueMontreal p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
            <div
                className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-4 sm:p-6 md:p-8 bg-offwhite rounded shadow-lg mt-16 md:mt-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Users List</h1>

                <div className="flex flex-wrap items-center gap-4 p-4 bg-offblack text-offwhite mb-4 rounded">
                    <div className="flex-1">
                        <strong className="text-base">First Name:</strong>
                    </div>
                    <div className="flex-1">
                        <strong className="text-base">Last Name:</strong>
                    </div>
                    <div className="flex-1">
                        <strong className="text-base">Role:</strong>
                    </div>
                </div>

                <div className="space-y-4">
                    {users.length > 0 ? (
                        users.map(user => (
                            <div
                                key={user.id}
                                className="bg-lightgray text-offblack rounded p-4 cursor-pointer text-base"
                                onClick={() => handleUserClick(user.id)} // Redirect on click
                            >
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1">
                                        {user.firstname}
                                    </div>
                                    <div className="flex-1">
                                        {user.lastname}
                                    </div>
                                    <div className="flex-1">
                                        {getRoleDisplayName(user.role)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-4">No users found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
