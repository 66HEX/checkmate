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
}

export default function Completed() {
    const [projects, setProjects] = useState<Project[]>([]);
    const { data: session, status } = useSession();
    const router = useRouter();

    const fetchProjects = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`id, title, description, tasks (id, status)`);

            if (error) {
                throw error;
            }

            const filteredProjects = data?.filter((project: Project) => {
                // Check if all tasks are completed
                return project.tasks.every((task: Task) => task.status === 'completed');
            }) || [];

            setProjects(filteredProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchProjects();
    }, [session, status, router, fetchProjects]);

    if (status === "loading") {
        return <div className="w-screen h-svh flex items-center justify-center font-NeueMontreal text-offwhite text-2xl">Loading Projects...</div>;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16">
            {projects.map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter((task) => task.status === 'completed').length;
                const uncompletedTasks = totalTasks - completedTasks;

                return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="w-full h-64 bg-offwhite hover:bg-gray text-offblack rounded shadow-lg p-6 cursor-pointer transition-all flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                            </div>
                            <div className="mt-4">
                                <p className="text-base text-gray-500 mb-1">
                                    {totalTasks} Tasks
                                </p>
                                <p className="text-base text-gray-500 mb-1">
                                    Completed: {completedTasks}
                                </p>
                                <p className="text-base text-gray-500">
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
