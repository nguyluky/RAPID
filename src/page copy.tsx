import { useEffect, useState } from "react";
import AsyncApiSection from "./components/AsyncApiSection";
import Header from "./components/Header";
import Modals, { ModalsProvider } from "./components/Modals";
import OverviewSection from "./components/OverviewSection";
import RestSection from "./components/RestSection";
import SchemasSection from "./components/SchemasSection";
import Sidebar from "./components/Sidebar";
import useHashUrlPath from "./hooks/useHashUrlPath";
import useLoadSchema from "./hooks/useLoadSchema";
import "./index.css";

export default function StoplightStyleSwagger({
    swaggerUrl,
    asyncApiUrl,
}: {
    swaggerUrl: string;
    asyncApiUrl: string;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [authToken, setAuthToken] = useState("");
    const { hashPath, updateHashPath } = useHashUrlPath();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "b") {
                event.preventDefault();
                setSidebarCollapsed((prev) => {
                    return !prev;
                });
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const { isLoading, asyncApiSchema, swaggerSchema } = useLoadSchema(
        swaggerUrl,
        asyncApiUrl
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    if (!swaggerSchema && !asyncApiSchema) {
        return (
            <div className="flex items-center justify-center h-screen">
                No API specifications found
            </div>
        );
    }

    return (
        <ModalsProvider>
            <div className="h-screen flex">
                <Sidebar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    socketApiSpec={asyncApiSchema}
                    apiSpec={swaggerSchema}
                ></Sidebar>
                <main className="h-full grid grid-rows-[auto_1fr] flex-1 overflow-hidden">
                    <Header 
                        setSidebarCollapsed={setSidebarCollapsed}
                    />

                    {/* content */}

                    <div className="flex-1 overflow-y-auto">
                        {(hashPath.startsWith("#overview") || hashPath == "") && (
                            <div className="overflow-y-auto flex-1">
                                <OverviewSection
                                    apiSpec={swaggerSchema}
                                    asyncApiSpec={asyncApiSchema}
                                />
                            </div>
                        )}
                        {hashPath.startsWith("#REST") && (
                            <RestSection apiSpec={swaggerSchema} authToken={authToken} />
                        )}
                        {hashPath.startsWith("#AsyncAPI") && (
                            <AsyncApiSection
                                asyncApiSpec={asyncApiSchema}
                            />
                        )}
                        {hashPath.startsWith("#SCHEMA") && (
                            <SchemasSection apiSpec={swaggerSchema}></SchemasSection>
                        )}
                    </div>

                </main>

                <Modals
                    apiSpec={swaggerSchema}
                    asyncApiSpec={asyncApiSchema}
                    setAuthToken={setAuthToken}
                ></Modals>
            </div>
        </ModalsProvider>
    );
}
