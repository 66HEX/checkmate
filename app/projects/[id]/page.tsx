"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient'; // Ensure this points to your Supabase client

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'uncompleted';
}

interface Project {
    id: number;
    title: string;
    description: string;
    user_email: string; // Email of the project owner
    tasks: Task[];
}

interface PageProps {
    params: {
        id: string; // ID from the URL
    };
}

export default function ProjectDetailPage({ params }: PageProps) {
    const [project, setProject] = useState<Project | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const projectId = params.id;

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchProject();
    }, [session, status, router]);

    const fetchProject = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`id, title, description, user_email, tasks (id, title, status)`)
                .eq('id', projectId)
                .single();

            if (error || !data) {
                router.push('/404');
                return;
            }

            setProject(data as Project);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const toggleTaskStatus = async (taskId: number, currentStatus: 'completed' | 'uncompleted') => {
        const newStatus = currentStatus === 'completed' ? 'uncompleted' : 'completed';
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) {
                throw error;
            }

            setProject(prev => {
                if (!prev) return null;

                // Ensure `tasks` is correctly typed as an array of `Task`
                const updatedTasks: Task[] = prev.tasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                );

                return {
                    ...prev,
                    tasks: updatedTasks
                };
            });
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    if (status === "loading" || project === null) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen max-w-5xl mx-auto font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16 mt-14">
            <div className="w-full h-full bg-offwhite text-offblack rounded shadow-lg p-4 flex flex-col justify-between">
                <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
                <p className="text-lg mb-4">{project.description}</p>
                <p className="text-sm mb-4">Owner&apos;s Email: {project.user_email}</p>

                <h2 className="text-xl font-semibold mb-2">Tasks</h2>
                {project.tasks.length > 0 ? (
                    <ul className="space-y-2 text-offwhite">
                        {project.tasks.map((task) => (
                            <li
                                key={task.id}
                                className={`p-4 rounded cursor-pointer transition-all ${
                                    task.status === 'completed'
                                        ? 'bg-greencustom hover:bg-greenhover'
                                        : 'bg-redcustom hover:bg-redhover'
                                }`}
                                onClick={() => toggleTaskStatus(task.id, task.status)}
                            >
                                <span className="font-medium">{task.title}:</span> {task.status}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No tasks available for this project.</p>
                )}
            </div>
        </div>
    );
}
