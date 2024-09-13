"use client";

import { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchProjects();
    }, [session, status, router]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`id, title, description, tasks (id, status)`)
                .eq('user_email', session?.user?.email); // Filter projects by the current user's email

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
    };

    if (status === "loading") {
        return <div className="p-4 text-center">Loading projects...</div>;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16 mt-14">
            {projects.map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter((task) => task.status === 'completed').length;
                const uncompletedTasks = totalTasks - completedTasks;

                return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="w-full h-64 bg-offwhite hover:bg-lightgray text-offblack rounded shadow-lg p-4 cursor-pointer transition-all flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                                <p className="text-sm text-darkgray">
                                    {project.description}
                                </p>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    {totalTasks} Tasks
                                </p>
                                <p className="text-sm text-gray-500">
                                    Completed: {completedTasks}
                                </p>
                                <p className="text-sm text-gray-500">
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
