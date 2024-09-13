"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient"; // Upewnij się, że ten import jest prawidłowy

export default function Profile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "loading") return; // Czekaj na załadowanie sesji

        if (!session) {
            router.push("/"); // Przekieruj, jeśli użytkownik nie jest zalogowany
        } else if (session?.user?.email) {
            setEmail(session.user.email); // Ustaw email z sesji
        }
    }, [session, status, router]);

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
        <div className="flex items-center justify-center h-screen w-screen text-offblack font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md p-8 bg-offwhite rounded-lg shadow-lg relative">
                <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>
                <div className="mb-4">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-2"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        readOnly
                        className="w-full p-2 bg-gray-200 text-offblack border border-lightgray rounded"
                    />
                </div>

                <form onSubmit={handlePasswordChange}>
                    <div className="mb-4">
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium mb-2"
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium mb-2"
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-offwhite text-offblack border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-center mb-4">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-bluecustom hover:bg-bluehover text-offwhite p-3 rounded transition-all shadow-lg mb-4"
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
