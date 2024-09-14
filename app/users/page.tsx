"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";

interface UserProfile {
    id: string;
    email: string;
    role: string;
}

export default function UsersList() {
    const { data: session, status } = useSession() as { data: Session | null; status: string };
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Changed to string | null
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/"); // Redirect to the home or login page if not authenticated
            return;
        }

        const fetchRoleAndUsers = async () => {
            try {
                const userId = session?.user?.id ?? '';

                // Fetch the user role
                const { data: roleData, error: roleError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (roleError) {
                    console.error("Error fetching user role:", roleError.message);
                    router.push("/");
                    return;
                }

                const role = roleData?.role;
                if (role !== 'admin') {
                    router.push("/");
                    return;
                }

                // Fetch all users if the role is admin
                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select('id, email, role')
                    .neq('id', userId);

                if (usersError) {
                    console.error("Error fetching users:", usersError.message);
                    setError(usersError.message); // Set error message directly
                } else {
                    setUsers(usersData || []);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                setError("Unexpected error occurred."); // Set a generic error message
            } finally {
                setLoading(false);
            }
        };

        fetchRoleAndUsers();
    }, [session, status, router]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                console.error("Error updating user role:", error.message);
                setError("Error updating user role."); // Set error message directly
            } else {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === userId ? { ...user, role: newRole } : user
                    )
                );
                setOpenDropdown(null); // Close the dropdown after role change
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            setError("Unexpected error occurred."); // Set a generic error message
        }
    };

    const toggleDropdown = (userId: string) => {
        setOpenDropdown(prevId => (prevId === userId ? null : userId));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="flex items-center justify-center h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-4xl p-8 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Users List</h1>

                <table className="w-full border-collapse">
                    <thead>
                    <tr className="bg-offblack text-offwhite">
                        <th className="border p-2 text-left">ID</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Role</th>
                        <th className="border p-2 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.length > 0 ? (
                        users.map(user => (
                            <tr key={user.id}>
                                <td className="border p-2">{user.id}</td>
                                <td className="border p-2">{user.email}</td>
                                <td className="border p-2">{user.role}</td>
                                <td className="border p-2 text-center relative">
                                    <button
                                        onClick={() => toggleDropdown(user.id)}
                                        className="bg-offblack hover:bg-darkgray text-offwhite px-4 py-2 rounded"
                                    >
                                        Change Role
                                    </button>
                                    {openDropdown === user.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute z-30 right-0 mt-2 w-48 text-offblack bg-offwhite border border-darkgray rounded shadow-lg"
                                        >
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'admin')}
                                                className="w-full px-4 py-2 text-left hover:bg-lightgray"
                                            >
                                                Promote to Admin
                                            </button>
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'worker')}
                                                className="w-full px-4 py-2 text-left hover:bg-lightgray"
                                            >
                                                Promote to Worker
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="border p-2 text-center">No users found.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
