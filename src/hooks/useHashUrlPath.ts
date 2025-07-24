import { useEffect, useState } from "react";

export default function useHashUrlPath() {
    const [hashPath, setHashPath] = useState("");

    useEffect(() => {
        const handleHashChange = () => {
            setHashPath(window.location.hash);
        };

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange(); // Set initial hash path

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    const updateHashPath = (newPath: string) => {
        if (newPath !== hashPath) {
            window.location.hash = newPath;
            setHashPath(newPath);
        }
    };

    return {
        hashPath,
        updateHashPath,
    };
}