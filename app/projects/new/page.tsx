"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient'; // Ensure this points to your Supabase client

export default function NewProjectForm() {
    const [projectTitle, setProjectTitle] = useState<string>('');
    const [projectDescription, setProjectDescription] = useState<string>('');
    const [tasks, setTasks] = useState<string[]>(['']);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
        }
    }, [session, status, router]);

    const handleTaskChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newTasks = [...tasks];
        newTasks[index] = event.target.value;
        setTasks(newTasks);
    };

    const handleAddTask = () => {
        setTasks([...tasks, '']);
    };

    const handleRemoveTask = (index: number) => {
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!session?.user?.email) {
            alert('User is not authenticated');
            return;
        }

        try {
            // Start a transaction
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert([{
                    title: projectTitle,
                    description: projectDescription,
                    user_email: session.user.email
                }])
                .select('id')
                .single();

            if (projectError) {
                throw projectError;
            }

            if (!project?.id) {
                throw new Error('Project ID is not available');
            }

            const projectId = project.id;

            const taskInserts = tasks.map(task => ({
                project_id: projectId,
                title: task,
                status: 'uncompleted'
            }));

            const { error: tasksError } = await supabase
                .from('tasks')
                .insert(taskInserts);

            if (tasksError) {
                throw tasksError;
            }

            alert('Project added successfully!');
            router.push('/projects');
        } catch (error) {
            alert('Failed to add project: ' + (error as Error).message);
            console.error('Error adding project:', error);
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 bg-lightgray">
            <form
                onSubmit={handleSubmit}
                className="bg-offwhite p-8 rounded-lg shadow-lg w-full max-w-lg mt-16 md:mt-0"
            >
                <h1 className="text-3xl font-bold mb-6 text-offblack text-center">Add New Project</h1>

                <div className="mb-6">
                    <label className="block text-darkgray text-sm mb-2">Project Title</label>
                    <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full p-2 bg-lightgray rounded focus:outline-none text-base"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-darkgray text-sm mb-2">Project Description</label>
                    <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full p-2 bg-lightgray rounded focus:outline-none text-base"
                        rows={2}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-darkgray text-sm mb-2">Tasks</label>
                    {tasks.map((task, index) => (
                        <div key={index} className="flex items-center mb-3">
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => handleTaskChange(index, e)}
                                className="w-full p-2 bg-lightgray rounded focus:outline-none text-base"
                                placeholder={`Task ${index + 1}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveTask(index)}
                                className="ml-3 p-2 bg-warning hover:bg-warninghover text-white rounded text-base"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <div className="w-full flex justify-end">
                        <button
                            type="button"
                            onClick={handleAddTask}
                            className="mt-2 w-full p-2 bg-success hover:bg-successhover text-white rounded text-base"
                        >
                            Add Task
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full p-2 bg-brand hover:bg-brandhover text-offwhite rounded shadow-lg text-base"
                >
                    Save Project
                </button>
            </form>
        </div>
    );
}
