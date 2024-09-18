"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';

interface Task {
    id?: number;
    title: string;
    status: 'completed' | 'uncompleted';
    order: number;
}

export default function NewProjectForm() {
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [projectDescription, setProjectDescription] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [isManager, setIsManager] = useState<boolean>(false);
    const [checkingRole, setCheckingRole] = useState<boolean>(true);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const checkUserRole = async () => {
            if (status === 'loading') return;

            if (!session) {
                router.push('/');
                return;
            }

            const userId = session?.user?.id ?? '';
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error || profile?.role !== 'manager') {
                router.push('/');
            } else {
                setIsManager(true);
            }
            setCheckingRole(false);
        };

        checkUserRole();
    }, [session, status, router]);

    const handleTaskChange = useCallback((index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        setTasks(prevTasks => {
            const updatedTasks = [...prevTasks];
            updatedTasks[index].title = event.target.value;
            return updatedTasks;
        });
    }, []);

    const handleAddTask = useCallback(() => {
        if (!newTaskTitle.trim()) return;

        setTasks(prevTasks => [
            ...prevTasks,
            { title: newTaskTitle, status: 'uncompleted', order: prevTasks.length + 1 }
        ]);
        setNewTaskTitle('');
    }, [newTaskTitle]);

    const handleRemoveTask = useCallback((index: number) => {
        setTasks(prevTasks => {
            const updatedTasks = prevTasks.filter((_, i) => i !== index);
            return updatedTasks.map((task, i) => ({ ...task, order: i + 1 }));
        });
    }, []);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!session?.user?.email) {
            alert('User is not authenticated');
            return;
        }

        try {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert([{ title: projectTitle, description: projectDescription, user_email: session.user.email }])
                .select('id')
                .single();

            if (projectError) throw projectError;
            if (!project?.id) throw new Error('Project ID is not available');

            const { error: tasksError } = await supabase
                .from('tasks')
                .insert(tasks.map(task => ({
                    project_id: project.id,
                    title: task.title,
                    status: task.status,
                    order: task.order
                })));

            if (tasksError) throw tasksError;

            router.push('/projects');
        } catch (error) {
            alert('Failed to add project: ' + (error as Error).message);
            console.error('Error adding project:', error);
        }
    }, [projectTitle, projectDescription, tasks, session, router]);

    if (status === 'loading' || checkingRole) {
        return null;
    }

    if (!isManager) {
        return null;
    }

    return (
        <div className="w-screen min-h-svh flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 bg-lightgray">
            <form
                onSubmit={handleSubmit}
                className="bg-offwhite p-6 rounded shadow-lg w-full max-w-xl mt-16 md:mt-0"
            >
                <h1 className="text-2xl font-bold mb-6 text-center">Add New Project</h1>

                <div className="mb-3">
                    <label className="block text-darkgray text-base mb-1">Project Title</label>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                            required
                            placeholder="Project Title"
                            maxLength={50}
                        />
                        <span className="text-right text-darkgray text-sm mt-1">
                            {50 - projectTitle.length} characters left
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-darkgray text-base mb-1">Project Description</label>
                    <div className="flex flex-col">
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                            rows={4}
                            required
                            placeholder="Project Description"
                            maxLength={500}
                        />
                        <span className="text-right text-darkgray text-sm mt-1">
                            {500 - projectDescription.length} characters left
                        </span>
                    </div>
                </div>

                <div className="">
                    <label className="block text-base mb-1">Tasks</label>
                    <ul className={`space-y-3 mb-3 ${tasks.length === 0 ? 'hidden' : ''}`}>
                        {tasks.map((task, index) => (
                            <li key={index} className="flex items-center rounded">
                                <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => handleTaskChange(index, e)}
                                    className="w-full p-2 border border-darkgray rounded text-base"
                                    placeholder={`Task ${index + 1}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTask(index)}
                                    className="ml-3 p-2 bg-offblack hover:bg-darkgray text-white rounded text-base"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>


                <div className="w-full flex flex-col mb-6">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                        placeholder="New Task Title"
                        maxLength={50}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAddTask}
                    className="w-full p-2 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg text-base mb-3"
                >
                    Add Task
                </button>

                <button
                    type="submit"
                    className="w-full p-2 bg-offblack hover:bg-darkgray text-offwhite rounded shadow-lg text-base"
                >
                    Save Project
                </button>
            </form>
        </div>
    );
}
