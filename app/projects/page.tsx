"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArrowIcon from "@/app/components/ui/ArrowIcon/ArrowIcon";
import { supabase } from '@/app/utils/supabaseClient';

interface Task {
    id: number;
    status: 'completed' | 'uncompleted';
}

interface Project {
    id: number;
    title: string;
    description: string;
    tasks: Task[];
}

export default function ProjectsList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { data: session, status } = useSession();
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            if (!session?.user?.id) return;

            // Pobranie projektów i roli użytkownika
            const [projectsData, roleData] = await Promise.all([
                supabase
                    .from('projects')
                    .select(`id, title, description, tasks (id, status)`),
                supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()
            ]);

            if (projectsData.error) throw projectsData.error;
            if (roleData.error) throw roleData.error;

            // Filtrowanie projektów z niezakończonymi zadaniami
            const filteredProjects = projectsData.data?.filter((project: Project) =>
                project.tasks.some((task: Task) => task.status === 'uncompleted')
            ) || [];

            setProjects(filteredProjects);
            setUserRole(roleData.data?.role || null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/');
            return;
        }

        fetchData();
    }, [session, status, router, fetchData]);

    if (status === 'loading' || loading) {
        return null;
    }

    const isManager = userRole === 'manager';

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            {isManager && (
                <Link href="/projects/new">
                    <div className="relative w-full h-64 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg p-6 flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-2xl font-bold">Add New Project</span>
                        <div className="absolute bottom-4 right-4 h-10 w-10">
                            <ArrowIcon width={40} height={40} />
                        </div>
                    </div>
                </Link>
            )}

            {projects.map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter((task) => task.status === 'completed').length;
                const uncompletedTasks = totalTasks - completedTasks;

                return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-6">{project.title}</h3>
                            </div>
                            <div>
                                <p className="text-base text-darkgray mb-1">
                                    {totalTasks} Tasks
                                </p>
                                <p className="text-base text-darkgray mb-1">
                                    Completed: {completedTasks}
                                </p>
                                <p className="text-base text-darkgray">
                                    Uncompleted: {uncompletedTasks}
                                </p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
