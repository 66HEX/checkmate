"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import Link from "next/link"; // Import Link for navigation

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
    const [isAdmin, setIsAdmin] = useState(false); // State to track if user is admin

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
                    router.push("/"); // Redirect non-admin users to homepage
                    return;
                } else {
                    setIsAdmin(true); // Set admin state if the user is an admin
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
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            {/* Kafel do dodawania nowego użytkownika, tylko dla administratorów */}
            {isAdmin && (
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
                users.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-2">{user.firstname} {user.lastname}</h3>
                            <p className="text-base text-darkgray mb-4">{user.email}</p>
                        </div>
                        <div className="mt-4">
                            <p className="text-base text-darkgray">
                                Role: {getRoleDisplayName(user.role)}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-4">No users found.</div>
            )}
        </div>
    );
}
