"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Tasks() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") {
            // Wait until the session status is determined
            return;
        }

        // Redirect to home if user is not authenticated
        if (!session) {
            router.push('/');
        }
    }, [session, status, router]);

    // Placeholder data
    const projects = [
        {
            id: 1,
            title: 'Project 1',
            description: 'Description for project 1',
            tasks: [
                { id: 1, title: 'Task 1', status: 'completed' },
                { id: 2, title: 'Task 2', status: 'uncompleted' },
            ],
        },
        {
            id: 2,
            title: 'Project 2',
            description: 'Description for project 2',
            tasks: [
                { id: 3, title: 'Task 3', status: 'completed' },
                { id: 4, title: 'Task 4', status: 'completed' },
            ],
        },
        {
            id: 3,
            title: 'Project 3',
            description: 'Description for project 3',
            tasks: [
                { id: 5, title: 'Task 5', status: 'uncompleted' },
            ],
        },
    ];

    // Return null or a loading spinner while checking session
    if (status === "loading") {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto font-JetBrainsMono p-4 md:p-8 lg:p-12 xl:p-16">
            <Link href="/projects/new">
                <div className="w-full h-64 bg-bluecustom hover:bg-bluehover text-offwhite rounded shadow-lg flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-2xl font-bold">+ Add New Project</span>
                </div>
            </Link>

            {projects.map((project) => (
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
                                {project.tasks.length} Tasks
                            </p>
                            <p className="text-sm text-gray-500">
                                Completed: {project.tasks.filter(task => task.status === 'completed').length}
                            </p>
                            <p className="text-sm text-gray-500">
                                Uncompleted: {project.tasks.filter(task => task.status === 'uncompleted').length}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
