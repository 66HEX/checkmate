"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/utils/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [projectTitleLength, setProjectTitleLength] = useState<number>(0);
    const [projectDescriptionLength, setProjectDescriptionLength] = useState<number>(0);
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
    }, [session, status, router]);

    useEffect(() => {
        setProjectTitleLength(projectTitle.length);
    }, [projectTitle]);

    useEffect(() => {
        setProjectDescriptionLength(projectDescription.length);
    }, [projectDescription]);

    const handleTaskChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const updatedTasks = [...tasks];
        updatedTasks[index].title = event.target.value;
        setTasks(updatedTasks);
    };

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            title: newTaskTitle,
            status: 'uncompleted',
            order: tasks.length + 1,
        };

        setTasks([...tasks, newTask]);
        setNewTaskTitle(''); // Reset the input field
    };

    const handleRemoveTask = (index: number) => {
        const updatedTasks = tasks.filter((_, i) => i !== index);
        updatedTasks.forEach((task, i) => task.order = i + 1); // Update order after removal
        setTasks(updatedTasks);
    };

    const handleOnDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        if (!destination || destination.index === source.index) {
            return;
        }

        const updatedTasks = Array.from(tasks);
        const [movedTask] = updatedTasks.splice(source.index, 1);
        updatedTasks.splice(destination.index, 0, movedTask);

        updatedTasks.forEach((task, index) => {
            task.order = index + 1;
        });

        setTasks(updatedTasks);

        try {
            for (const task of updatedTasks) {
                const { error } = await supabase
                    .from('tasks')
                    .update({ order: task.order })
                    .eq('id', task.id);

                if (error) {
                    throw new Error(error.message);
                }
            }
        } catch (error) {
            console.error('Error updating task order:', error);
        }
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

            const taskInserts = tasks.map((task) => ({
                project_id: projectId,
                title: task.title,
                status: task.status,
                order: task.order
            }));

            const { error: tasksError } = await supabase
                .from('tasks')
                .insert(taskInserts);

            if (tasksError) {
                throw tasksError;
            }

            router.push('/projects');
        } catch (error) {
            alert('Failed to add project: ' + (error as Error).message);
            console.error('Error adding project:', error);
        }
    };

    if (status === "loading") {
        return <div className="w-screen h-svh flex items-center justify-center font-NeueMontreal text-offwhite text-2xl">Loading...</div>;
    }

    return (
        <div className="w-screen flex flex-col items-center justify-center font-NeueMontreal p-4 md:p-8 lg:p-12 xl:p-16 bg-lightgray">
            <form
                onSubmit={handleSubmit}
                className="bg-offwhite p-8 rounded shadow-lg w-full max-w-xl mt-16 md:mt-0"
            >
                <h1 className="text-3xl font-bold mb-6 text-offblack text-center">Add New Project</h1>

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
                            maxLength={60}
                        />
                        <span className="text-right text-darkgray text-sm mt-1">
                            {60 - projectTitleLength} characters left
                        </span>
                    </div>
                </div>

                <div className="mb-3">
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
                            {500 - projectDescriptionLength} characters left
                        </span>
                    </div>
                </div>


                <div className="mb-3">
                    <label className="block text-darkgray text-base mb-1">Tasks</label>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="tasks">
                            {(provided) => (
                                <ul
                                    className="space-y-4"
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {tasks.map((task, index) => (
                                        <Draggable key={index} draggableId={index.toString()} index={index}>
                                            {(provided) => (
                                                <li
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="flex items-center rounded"
                                                >
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
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </ul>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <div className="w-full flex flex-col mb-6">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full p-2 border border-darkgray focus:outline-none rounded text-base"
                        placeholder="New Task Title"
                        maxLength={50} // Limit input to 50 characters
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
