"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';
import { FaCheck, FaTimes } from 'react-icons/fa';

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
    const [deletedTasks, setDeletedTasks] = useState<number[]>([]); // Zadania oznaczone do usunięcia
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
            // Update project details
            const { error: projectError } = await supabase
                .from('projects')
                .update({ title: editTitle, description: editDescription })
                .eq('id', projectId);

            if (projectError) {
                throw projectError;
            }

            // Update existing tasks
            const updateTasksPromises = editTasks.map(task =>
                supabase
                    .from('tasks')
                    .update({ title: task.title, order: task.order })
                    .eq('id', task.id)
            );

            await Promise.all(updateTasksPromises);

            // Insert new tasks (those without an ID)
            const newTasks = editTasks.filter(task => !task.id);
            if (newTasks.length > 0) {
                const { error: newTasksError } = await supabase
                    .from('tasks')
                    .insert(newTasks.map(task => ({
                        title: task.title,
                        status: task.status,
                        order: task.order,
                        project_id: projectId,
                    })));

                if (newTasksError) {
                    throw newTasksError;
                }
            }

            // Delete tasks marked for deletion
            if (deletedTasks.length > 0) {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .in('id', deletedTasks);

                if (deleteError) {
                    throw deleteError;
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

    const handleDeleteTask = (taskId: number) => {
        // Tymczasowe oznaczenie zadania do usunięcia
        setDeletedTasks([...deletedTasks, taskId]);

        // Usunięcie zadania z widoku (stanu komponentu)
        setEditTasks(editTasks.filter(task => task.id !== taskId));
    };

    const handleDelete = async () => {
        const confirmation = window.confirm("Are you sure you want to delete this project?");

        if (!confirmation) {
            return;
        }

        try {
            // Usuwanie projektu oraz wszystkich zadań
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

    const handleEditClick = async () => {
        setIsEditing(true);
        await fetchProject(); // Fetch tasks when starting editing
    };

    if (status === "loading" || loading || project === null) {
        return null;
    }

    const isManager = userRole === 'manager';

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16 md:mt-0">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">
                    Project Manager&apos;s Email: <span className="font-medium text-base">{project.user_email}</span></p>

                {isEditing ? (
                    <>
                        <div className="mb-3">
                            <label className="block text-darkgray text-base mb-1">Project Title</label>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                    placeholder="Project Title"
                                    maxLength={50}
                                />
                                <span className="text-right text-darkgray text-sm">
                                    {50 - editTitle.length} characters left
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-darkgray text-base mb-1">Project Description</label>
                            <div className="flex flex-col">
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full p-2 mb-1 border border-darkgray focus:outline-none rounded text-base"
                                    placeholder="Project Description"
                                    rows={4}
                                    maxLength={500}
                                />
                                <span className="text-right text-darkgray text-sm">
                                    {500 - editDescription.length} characters left
                                </span>
                            </div>
                        </div>

                        <h2 className="text-darkgray text-base mb-3">Tasks</h2>
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
                                {isManager && (
                                    <div className="flex flex-row items-center justify-center ml-2">
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="bg-offblack hover:bg-darkgray text-white p-2 rounded"
                                        >
                                            Remove
                                        </button>
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
                            Save Project
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
                        <h1 className="text-4xl font-bold mb-6">{project.title}</h1>
                        <p className="text-base mb-6">{project.description}</p>
                        {isManager && (
                            <>
                                <button
                                    onClick={handleEditClick}
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
                            <ul className="space-y-3">
                                {project.tasks.map((task) => (
                                    <li
                                        key={task.id}
                                        className={`p-2 rounded cursor-pointer transition-all text-offwhite text-base flex items-center justify-between ${
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
