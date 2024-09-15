"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/app/utils/supabaseClient";
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import Link from "next/link";

interface Team {
    id: string;
    name: string;
    description: string;
    created_at: string;
    user_count?: number; // Make user_count optional
    leader_id?: string;  // Add leader_id
    leader?: {
        firstname: string;
        lastname: string;
    } | null;
}

export default function TeamsList() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            if (status === "loading") return;

            if (!session) {
                router.push("/"); // Redirect if not authenticated
                return;
            }

            try {
                const userId = session?.user?.id ?? '';

                // Fetch the user's role to check if they're a manager
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

                // Fetch teams data
                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select(`id, name, description, created_at, leader_id`);

                if (teamsError) {
                    console.error("Error fetching teams:", teamsError.message);
                    setError(teamsError.message);
                } else {
                    // For each team, get the leader's name and count the number of users
                    const teamsWithDetails = await Promise.all(
                        teamsData.map(async (team: Team) => {
                            // Fetch the leader's name
                            const { data: leaderData, error: leaderError } = await supabase
                                .from('profiles')
                                .select('firstname, lastname')
                                .eq('id', team.leader_id)
                                .single();

                            if (leaderError) {
                                console.error(`Error fetching leader for team ${team.id}:`, leaderError.message);
                            }

                            // Count the number of users
                            const { count, error: countError } = await supabase
                                .from('profiles')
                                .select('*', { count: 'exact' })
                                .eq('team_id', team.id);

                            if (countError) {
                                console.error(`Error counting users for team ${team.id}:`, countError.message);
                            }

                            return {
                                ...team,
                                leader: leaderData ? { firstname: leaderData.firstname, lastname: leaderData.lastname } : null,
                                user_count: count ?? 0,
                            };
                        })
                    );

                    setTeams(teamsWithDetails);
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                setError("Unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, [session, status, router]);


    const handleTeamClick = (teamId: string) => {
        router.push(`/teams/${teamId}`);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            {isManager && (
                <Link href="/teams/new">
                    <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-2xl font-bold">Add New Team</span>
                        <div className="absolute bottom-4 right-4 h-10 w-10">
                            <ArrowIcon width={40} height={40} />
                        </div>
                    </div>
                </Link>
            )}

            {teams.length > 0 && teams.map((team) => (
                <div
                    key={team.id}
                    onClick={() => handleTeamClick(team.id)}
                    className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between"
                >
                    <div>
                        <h3 className="text-2xl font-bold mb-6">{team.name}</h3>
                    </div>
                    <div>
                        <p className="text-base text-darkgray mb-1">
                            Users assigned: {team.user_count ?? 0}
                        </p>
                        <p className="text-base text-darkgray mb-1">
                            {team.leader ? `Team Leader: ${team.leader.firstname} ${team.leader.lastname}` : 'No leader assigned'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
