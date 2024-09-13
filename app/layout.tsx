import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/app/components/ui/Sidebar/Sidebar";
import SessionProviderWrapper from "@/app/components/SessionProviderWrapper";


export const metadata: Metadata = {
    title: "Checkmate",
    description: "Checkmate is a To Do list application for managing project states effectively.",
    keywords: "To Do list, project management, task management, Checkmate"
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className="bg-lightgray">
        <SessionProviderWrapper>
            <Sidebar />
            {children}
        </SessionProviderWrapper>
        </body>
        </html>
    );
}
