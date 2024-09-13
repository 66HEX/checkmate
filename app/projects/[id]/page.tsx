"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'uncompleted';
}

interface Project {
    id: number;
    title: string;
    description: string;
    user_email: string;
    tasks: Task[];
}

interface PageProps {
    params: {
        id: string;
    };
}

export default function ProjectDetailPage({ params }: PageProps) {
    const [project, setProject] = useState<Project | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const projectId = params.id;

    const fetchProject = useCallback(async () => {
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
    }, [projectId, router]);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchProject();
    }, [session, status, router, fetchProject]);

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
        return <div className="w-screen h-screen flex items-center justify-center font-JetBrainsMono text-offblack text-2xl">Loading...</div>;
    }

    return (
        <div className="w-screen max-w-5xl mx-auto font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16">
            <div className="w-full h-full bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <h1 className="text-4xl font-bold mb-6">{project.title}</h1>
                <p className="text-xl mb-6">{project.description}</p>
                <p className="text-base mb-6">Owner&apos;s Email: <span className="font-medium text-base">{project.user_email}</span></p>

                <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
                {project.tasks.length > 0 ? (
                    <ul className="space-y-4">
                        {project.tasks.map((task) => (
                            <li
                                key={task.id}
                                className={`p-2 rounded cursor-pointer transition-all text-offwhite text-lg font-medium ${
                                    task.status === 'completed'
                                        ? 'bg-success hover:bg-successhover'
                                        : 'bg-warning hover:bg-warninghover'
                                }`}
                                onClick={() => toggleTaskStatus(task.id, task.status)}
                            >
                                <span>{task.title}:</span> {task.status}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-lg">No tasks available for this project.</p>
                )}
            </div>
        </div>
    );
}
