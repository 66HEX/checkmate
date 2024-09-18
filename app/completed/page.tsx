"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
    totalTasks: number;
    completedTasks: number;
    uncompletedTasks: number;
}

interface SupabaseProject {
    id: number;
    title: string;
    description: string;
    tasks: Task[];
}

export default function CompletedProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    const fetchProjects = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`id, title, description, tasks (id, status)`);

            if (error) throw error;

            const filteredProjects = (data as SupabaseProject[] | null)?.filter((project: SupabaseProject) => {
                return project.tasks.every((task: Task) => task.status === 'completed');
            }).map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter((task) => task.status === 'completed').length;
                return {
                    ...project,
                    totalTasks,
                    completedTasks,
                    uncompletedTasks: totalTasks - completedTasks
                } as Project;
            }) || [];

            setProjects(filteredProjects);
        } catch (error) {
            setError('Error fetching projects');
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (status === "loading") return;

        if (!session) {
            router.push('/');
            return;
        }

        fetchProjects().finally(() => {
            if (isMounted) setLoading(false);
        });

        return () => { isMounted = false; };
    }, [session, status, router, fetchProjects]);

    if (error) {
        return <div>{error}</div>;
    }

    if (status === "loading" || loading) {
        return null;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-6">{project.title}</h3>
                        </div>
                        <div>
                            <p className="text-base text-darkgray mb-1">
                                {project.totalTasks} Tasks
                            </p>
                            <p className="text-base text-darkgray mb-1">
                                Completed: {project.completedTasks}
                            </p>
                            <p className="text-base text-darkgray">
                                Uncompleted: {project.uncompletedTasks}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
