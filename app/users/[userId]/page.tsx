"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";

interface User {
    id: string;
    email: string;
    role: string;
    firstname: string;
    lastname: string;
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
    const [loading, setLoading] = useState<boolean>(true);
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = params.userId;

    const fetchUser = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role, firstname, lastname')
                .eq('id', userId)
                .single();

            if (error || !data) {
                router.push("/404");
                return;
            }

            setUser(data as User);
            setEditRole(data.role);
            setEditFirstname(data.firstname);
            setEditLastname(data.lastname);
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, router]);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push("/");
            return;
        }

        fetchUser();
    }, [session, status, router, fetchUser]);

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: editRole, firstname: editFirstname, lastname: editLastname })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            setUser((prevUser) => {
                if (!prevUser) return null;
                return { ...prevUser, role: editRole, firstname: editFirstname, lastname: editLastname };
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
            // Type guard to ensure `error` is an `Error` instance
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error("Error deleting user:", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading || user === null) {
        return null;
    }

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">User ID: <span className="font-medium text-base">{user.id}</span></p>
                {isEditing ? (
                    <>
                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">First Name</label>
                            <input
                                type="text"
                                value={editFirstname}
                                onChange={(e) => setEditFirstname(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">Last Name</label>
                            <input
                                type="text"
                                value={editLastname}
                                onChange={(e) => setEditLastname(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">User Role</label>
                            <div className="relative">
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full p-2 border border-darkgray focus:outline-none rounded text-base appearance-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="worker">Worker</option>
                                </select>
                            </div>
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
                        <h1 className="text-4xl font-bold mb-3">
                            {user.firstname} {user.lastname}
                        </h1>
                        <p className="text-lg mb-3">Email: {user.email}</p>
                        <p className="text-lg mb-6">Role: {user.role}</p>
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
            </div>
        </div>
    );
}
