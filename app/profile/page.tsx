"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";

export default function Profile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [role, setRole] = useState<string | undefined>();
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/");
        } else if (session?.user?.id) {
            const userId = session.user.id;
            setEmail(session.user.email || "");

            const fetchRole = async () => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', userId)
                        .single(); // Fetch a single row

                    if (error) {
                        console.error("Error fetching user role:", error.message);
                    } else {
                        setRole(data?.role);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            };

            fetchRole();
        }
    }, [session, status, router]);

    // Funkcja mapująca rolę
    const mapRole = (role: string | undefined) => {
        if (role === 'manager') return 'Project Manager';
        if (role === 'leader') return 'Team Leader';
        if (role === 'worker') return 'Worker';
        return role; // jeśli inna rola, zwróć ją bez zmian
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setError("Failed to update password: " + error.message);
            } else {
                alert("Password updated successfully");
            }
        } catch (error) {
            setError("Error updating password");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-svh w-screen text-offblack font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>

                <div className="mb-3">
                    <label htmlFor="email" className="block text-base mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        readOnly
                        className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="role" className="block text-base mb-1">Role</label>
                    <input
                        type="text"
                        id="role"
                        value={mapRole(role) || "Loading..."} // Używamy funkcji mapującej
                        readOnly
                        className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                    />
                </div>

                <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="block text-base mb-1">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`New Password`}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-base mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-2 text-offblack border border-darkgray focus:outline-none rounded text-base"
                            placeholder={`Confirm Password`}
                        />
                    </div>

                    {error && (
                        <p className="text-warning text-center mb-3 text-base">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-offblack hover:bg-darkgray text-offwhite p-2 text-base rounded transition-all shadow-lg flex items-center justify-center"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
