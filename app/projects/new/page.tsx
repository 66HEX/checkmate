"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function NewProjectForm() {
    const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [tasks, setTasks] = useState(['']);

    const handleTaskChange = (index, event) => {
        const newTasks = [...tasks];
        newTasks[index] = event.target.value;
        setTasks(newTasks);
    };

    const handleAddTask = () => {
        setTasks([...tasks, '']);
    };

    const handleRemoveTask = (index) => {
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Tutaj można dodać kod do obsługi wysyłania formularza
        console.log('Project Title:', projectTitle);
        console.log('Project Description:', projectDescription);
        console.log('Tasks:', tasks);
    };

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16 bg-lightgray">
            <form
                onSubmit={handleSubmit}
                className="bg-offwhite p-6 rounded-lg shadow-lg w-full max-w-2xl"
            >
                <h1 className="text-2xl font-bold mb-4 text-offblack text-center">Add New Project</h1>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-darkgray mb-2">Project Title</label>
                    <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full p-2 border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-darkgray mb-2">Project Description</label>
                    <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full p-2 border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                        rows="3"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-darkgray mb-2">Tasks</label>
                    {tasks.map((task, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <input
                                type="text"
                                value={task}
                                onChange={(e) => handleTaskChange(index, e)}
                                className="w-full p-2 border border-lightgray rounded focus:outline-none focus:border-bluecustom"
                                placeholder={`Task ${index + 1}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveTask(index)}
                                className="ml-2 p-2 bg-redcustom hover:bg-redhover text-white rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <div className="w-full flex justify-end">
                        <button
                            type="button"
                            onClick={handleAddTask}
                            className="mt-2 w-full p-2 bg-greencustom hover:bg-greenhover text-white rounded"
                        >
                            Add Task
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full p-2 bg-bluecustom hover:bg-bluehover text-offwhite rounded shadow-lg"
                >
                    Save Project
                </button>
            </form>

            <Link href="/projects" className="mt-4 text-bluecustom hover:underline">
                Back to Projects
            </Link>
        </div>
    );
}
