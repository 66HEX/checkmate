"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { MdOutlineArrowDropUp , MdOutlineArrowDropDown } from "react-icons/md";

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'uncompleted';
    order: number;
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
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTasks, setEditTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { data: session, status } = useSession();
    const router = useRouter();
    const projectId = params.id;

    const fetchProject = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`id, title, description, user_email, tasks (id, title, status, order)`)
                .eq('id', projectId)
                .single();

            if (error || !data) {
                router.push('/404');
                return;
            }

            const sortedTasks = data.tasks.sort((a: Task, b: Task) => a.order - b.order);

            setProject({
                ...data,
                tasks: sortedTasks
            } as Project);

            setEditTitle(data.title);
            setEditDescription(data.description);
            setEditTasks(sortedTasks);

        } catch (error) {
            console.error('Error fetching project:', error);
        }
    }, [projectId, router]);

    const fetchUserRole = useCallback(async () => {
        try {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                throw error;
            }

            setUserRole(data?.role || null);
        } catch (error) {
            console.error('Error fetching user role:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        fetchProject();
        fetchUserRole();
    }, [session, status, router, fetchProject, fetchUserRole]);

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

    const handleSave = async () => {
        try {
            // Aktualizacja projektu
            const { error: projectError } = await supabase
                .from('projects')
                .update({ title: editTitle, description: editDescription })
                .eq('id', projectId);

            if (projectError) {
                throw projectError;
            }

            // Aktualizacja istniejących tasków
            const updateTasksPromises = editTasks.map(task =>
                supabase
                    .from('tasks')
                    .update({ title: task.title, order: task.order })
                    .eq('id', task.id)
            );

            await Promise.all(updateTasksPromises);

            // Zapis nowych tasków, które nie mają jeszcze ID
            const newTasks = editTasks.filter(task => !task.id);
            if (newTasks.length > 0) {
                const { error: newTasksError } = await supabase
                    .from('tasks')
                    .insert(newTasks.map(task => ({
                        title: task.title,
                        status: task.status,
                        order: task.order,
                        project_id: projectId,
                    })))

                if (newTasksError) {
                    throw newTasksError;
                }
            }

            setIsEditing(false);
            fetchProject();
        } catch (error) {
            console.error('Error updating project or tasks:', error);
        }
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: 0,
            title: newTaskTitle,
            status: 'uncompleted',
            order: editTasks.length + 1,
        };

        setEditTasks([...editTasks, newTask]);
        setNewTaskTitle('');
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) {
                throw error;
            }

            setProject(prev => {
                if (!prev) return null;
                const updatedTasks = prev.tasks.filter(task => task.id !== taskId);
                return {
                    ...prev,
                    tasks: updatedTasks,
                };
            });

        } catch (error) {
            console.error('Error deleting task:', error);
        }
        fetchProject();
    };

    const handleDelete = async () => {
        const confirmation = window.confirm("Are you sure you want to delete this project?");

        if (!confirmation) {
            return;
        }

        try {
            const { error: tasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('project_id', projectId);

            if (tasksError) {
                throw tasksError;
            }

            const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (projectError) {
                throw projectError;
            }

            router.push('/projects');
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleTaskOrderChange = (index: number, direction: 'up' | 'down') => {
        setEditTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const taskToMove = newTasks[index];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;

            if (swapIndex < 0 || swapIndex >= newTasks.length) return newTasks;

            newTasks[index] = newTasks[swapIndex];
            newTasks[swapIndex] = taskToMove;

            // Update the order of tasks
            newTasks.forEach((task, idx) => (task.order = idx + 1));

            return newTasks;
        });
    };

    if (status === "loading" || loading || project === null) {
        return null;
    }

    const isAdmin = userRole === 'admin';

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">Project Manager&apos;s Email: <span className="font-medium text-base">{project.user_email}</span></p>

                {isEditing ? (
                    <>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Project Title</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                maxLength={60} // Limit input to 60 characters
                            />
                            <span className="text-right text-darkgray text-sm">
                                {60 - editTitle.length} characters left
                            </span>
                        </div>
                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">Project Description</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                rows={4}
                                maxLength={500}
                            />
                            <span className="text-right text-darkgray text-sm">
                                {500 - editDescription.length} characters left
                            </span>
                        </div>
                        <h2 className="text-2xl font-semibold mb-3">Tasks</h2>
                        {editTasks.map((task, index) => (
                            <div key={index} className="flex items-center mb-3">
                                <input
                                    type="text"
                                    value={task.title}
                                    placeholder={`Task ${index + 1}`}
                                    onChange={(e) => {
                                        const updatedTasks = [...editTasks];
                                        updatedTasks[index].title = e.target.value;
                                        setEditTasks(updatedTasks);
                                    }}
                                    className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                                />
                                {isAdmin && (
                                    <div className="flex flex-row items-center justify-center ml-2">
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mr-0.5"
                                        >
                                            Remove
                                        </button>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => handleTaskOrderChange(index, 'up')}
                                                className="bg-offblack hover:bg-darkgray text-offwhite rounded p-0.5 mb-0.5"
                                            >
                                                <MdOutlineArrowDropUp />
                                            </button>
                                            <button
                                                onClick={() => handleTaskOrderChange(index, 'down')}
                                                className="bg-offblack hover:bg-darkgray text-offwhite rounded p-0.5"
                                            >
                                                <MdOutlineArrowDropDown />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center mb-6">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                                placeholder="New Task Title"
                            />
                        </div>
                        <button
                            onClick={handleAddTask}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mb-3"
                        >
                            Add Task
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded mb-3"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
                        <p className="text-lg mb-6">{project.description}</p>
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-3"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-6"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        <h2 className="text-2xl font-semibold mb-3">Tasks</h2>
                        {project.tasks.length > 0 ? (
                            <ul className="space-y-4">
                                {project.tasks.map((task) => (
                                    <li
                                        key={task.id}
                                        className={`p-2 rounded cursor-pointer transition-all text-offwhite text-lg font-medium flex items-center justify-between ${
                                            task.status === 'completed'
                                                ? 'bg-success hover:bg-successhover'
                                                : 'bg-warning hover:bg-warninghover'
                                        }`}
                                        onClick={() => toggleTaskStatus(task.id, task.status)}
                                    >
                                        <span>{task.title}</span>
                                        <span className="text-xl">
                                            {task.status === 'completed' ? <FaCheck /> : <FaTimes />}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-lg">No tasks available for this project.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

