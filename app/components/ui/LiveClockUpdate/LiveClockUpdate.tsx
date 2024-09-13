"use client";
import React, { useState, useEffect } from "react";

const LiveClockUpdate: React.FC = () => {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());

        const timerID = setInterval(() => {
            setDate(new Date());
        }, 1000);

        return () => clearInterval(timerID);
    }, []);

    if (!date) {
        return <div className="fixed top-4 right-4 text-offwhite">Loading...</div>;
    }

    return (
        <div>
            <p className="fixed top-4 right-4 text-offwhite">
                {date.toLocaleTimeString()}
            </p>
        </div>
    );
};

export default LiveClockUpdate;
