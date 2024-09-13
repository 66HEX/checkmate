"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FaCheck, FaTimes } from 'react-icons/fa'; // Import icons

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

    const handleOnDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        if (!destination || destination.index === source.index) {
            return;
        }

        const updatedTasks = Array.from(project?.tasks || []);
        const [movedTask] = updatedTasks.splice(source.index, 1);
        updatedTasks.splice(destination.index, 0, movedTask);

        updatedTasks.forEach((task, index) => {
            task.order = index + 1;
        });

        setProject(prev => prev ? { ...prev, tasks: updatedTasks } : null);

        try {
            for (let i = 0; i < updatedTasks.length; i++) {
                const { error } = await supabase
                    .from('tasks')
                    .update({ order: i + 1 })
                    .eq('id', updatedTasks[i].id);

                if (error) {
                    throw new Error(error.message);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error("Error updating task order:", error.message);
            } else {
                console.error("An unknown error occurred");
            }
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
                    .update({ title: task.title })
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
                    })));


                if (newTasksError) {
                    throw newTasksError;
                }
            }

            setIsEditing(false);
            fetchProject();  // Odswież dane po zapisaniu
        } catch (error) {
            console.error('Error updating project or tasks:', error);
        }
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: 0, // tymczasowe, do zaktualizowania przy zapisie
            title: newTaskTitle,
            status: 'uncompleted',
            order: editTasks.length + 1,
        };

        setEditTasks([...editTasks, newTask]);
        setNewTaskTitle(''); // Resetuj pole tekstowe
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

            // Aktualizacja stanu po usunięciu zadania
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
    };

    const handleDelete = async () => {
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

            router.push('/'); // Redirect to the homepage or any other page after deletion
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    if (status === "loading" || project === null) {
        return <div className="w-screen h-svh flex items-center justify-center font-NeueMontreal text-offwhite text-2xl">Loading...</div>;
    }

    return (
        <div className="w-screen mx-auto flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 mt-16">
            <div className="w-full h-full max-w-xl bg-offwhite text-offblack rounded shadow-lg p-6 flex flex-col justify-between">
                <p className="text-base mb-6">Owner&apos;s Email: <span className="font-medium text-base">{project.user_email}</span></p>

                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-2 mb-4 border border-darkgray focus:outline-none rounded text-base"
                        />
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full p-2 mb-4 border border-darkgray focus:outline-none rounded text-base"
                        />
                        <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
                        {editTasks.map((task, index) => (
                            <div key={index} className="flex items-center mb-4">
                                <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => {
                                        const updatedTasks = [...editTasks];
                                        updatedTasks[index].title = e.target.value;
                                        setEditTasks(updatedTasks);
                                    }}
                                    className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                                />
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="ml-2 bg-offblack hover:bg-darkgray text-white p-2 rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center mb-4">
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
                        <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
                        <p className="text-xl mb-6">{project.description}</p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-3"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="bg-offblack hover:bg-darkgray text-white px-4 py-2 rounded mb-3"
                        >
                            Delete
                        </button>
                        <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
                        {project.tasks.length > 0 ? (
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="tasks">
                                    {(provided) => (
                                        <ul
                                            className="space-y-4"
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {project.tasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <li
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
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
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        ) : (
                            <p className="text-lg">No tasks available for this project.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
