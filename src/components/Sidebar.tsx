import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useHashUrlPath from "@/hooks/useHashUrlPath";
import { cn, getMethodColor } from "@/lib/utils";
import {
    ArrowRight,
    ChevronDown,
    ChevronRight,
    Database,
    FileText,
    Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;

    apiSpec: any;
    socketApiSpec: any;
}

export default function Sidebar({
    sidebarCollapsed,
    setSidebarCollapsed,

    apiSpec,
    socketApiSpec
}: SidebarProps) {
    const { hashPath, updateHashPath } = useHashUrlPath();

    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set()
    );
    const toggleSection = (section: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const openSection = (section: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            newSet.add(section);
            return newSet;
        });
    }

    const [groupedEndpoints] = useState<any>(() => {
        const groupEndpointsByTags = (paths: any) => {
            const grouped: Record<string, Record<string, any>> = {};
            for (const [path, methods] of Object.entries(paths)) {
                for (const [method, details] of Object.entries(methods!)) {
                    const tags = (details as any).tags || ["General"];
                    for (const tag of tags) {
                        if (!grouped[tag]) {
                            grouped[tag] = {};
                        }
                        if (!grouped[tag][path]) {
                            grouped[tag][path] = {};
                        }
                        grouped[tag][path][method] = details;
                    }
                }
            }
            return grouped;
        };
        return groupEndpointsByTags(apiSpec.paths || {});
    });
    
    // auto expand sections based on hashPath
    useEffect(() => {
        const pathParts = hashPath.split("-");
        const section = pathParts[0].replace("#", "");

        if (section === "REST") {
            // Expand endpoints section and specific tag
            const [methodPath, method] = pathParts[1].split("_");
            const tag = apiSpec.paths?.[methodPath]?.[method]?.tags?.[0] || "General";

            openSection("endpoints");
            openSection(`tag-${tag}`);
        } else if (section === "SCHEMA") {
            // Expand schemas section
            openSection("schemas");
        } else if (section === "SOCKET") {
            // TODO: Expand socket sections based on hashPath
        }
    }, [hashPath])

    return (
        <>
            <div
                className={cn(
                    "hidden sm:block w-0 transition-all duration-300",
                    sidebarCollapsed
                        ? "w-0 lg:w-0"
                        : "w-full sm:w-80 lg:w-80",
                )}
            ></div>
            <aside
                className={cn(
                    "h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col absolute w-full sm:w-80 lg:w-80",
                    sidebarCollapsed ? "-left-full" : "left-0"
                )}
            >

                {/* Sidebar Content with independent scroll */}
                <div className="flex-1 overflow-y-auto relative z-50 bg-white">
                    <div className="p-3 sm:p-4 space-y-4">
                        {/* Sidebar Header with Close Button */}

                        <Separator />

                        {/* Project Info */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="space-y-2">
                                <h2 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 ">
                                    {apiSpec.info?.title || "API Documentation"}
                                </h2>
                                <Badge variant="outline" className="text-xs">
                                    v{apiSpec.info?.version || "1.0.0"}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarCollapsed(true)}
                                className="p-1 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
                                title="Close sidebar (Esc)"
                                aria-label="Close sidebar"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* overview */}
                        <Separator />
                        <div className="flex items-center justify-between pb-2">
                            <h3 className="font-bold">Overview</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateHashPath("overview")}
                                className={cn(
                                    "text-xs",
                                    hashPath === "overview" ? "text-blue-600" : "text-slate-500"
                                )}
                            >
                                View
                            </Button>
                        </div>

                        {/* head swagger */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="font-bold">Swagger Api</h3>
                        </div>

                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm p-2"
                                onClick={() => toggleSection("endpoints")}
                            >
                                <span className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Endpoints
                                </span>
                                <ChevronRight
                                    className={cn(
                                        "w-4 h-4 transition-transform duration-100",
                                        expandedSections.has("endpoints")
                                            ? "transform rotate-90"
                                            : "transform rotate-0"
                                    )}
                                />
                            </Button>

                            <div className={cn("ml-4 space-y-2 transition-all duration-100",
                                expandedSections.has("endpoints") ? "max-h-[10000px] overflow-y-auto" : "max-h-0 overflow-hidden"
                            )}>
                                {Object.entries(groupedEndpoints).map(
                                    ([tag, pathsForTag]) => (
                                        <div key={tag} className="space-y-1">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-between text-xs p-1.5 h-auto font-medium text-slate-700"
                                                onClick={() => toggleSection(`tag-${tag}`)}
                                            >
                                                <span className="flex items-center">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                                                    {tag}
                                                </span>
                                                {expandedSections.has(`tag-${tag}`) ? (
                                                    <ChevronDown className="w-3 h-3" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3" />
                                                )}
                                            </Button>

                                            {expandedSections.has(`tag-${tag}`) && (
                                                <div className="ml-4 space-y-1">
                                                    {Object.entries(pathsForTag!).map(
                                                        ([path, methods]) => (
                                                            <div key={path}>
                                                                {Object.entries(methods as any).map(
                                                                    ([method, details]: [string, any]) => (
                                                                        <Button
                                                                            key={`${path}-${method}`}
                                                                            variant={
                                                                                hashPath === `${path}-${method}`
                                                                                    ? "secondary"
                                                                                    : "ghost"
                                                                            }
                                                                            className="w-full justify-start text-xs p-2 h-auto"
                                                                            onClick={() =>
                                                                                updateHashPath(
                                                                                    `#REST-${path}_${method}`
                                                                                )
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-2 w-full">
                                                                                <div
                                                                                    className={cn(
                                                                                        "text-xs px-1.5 py-0.5 rounded font-medium border w-[60px]",
                                                                                        getMethodColor(method)
                                                                                    )}
                                                                                >
                                                                                    {method.toUpperCase()}
                                                                                </div>
                                                                                <div className="text-left flex-1 min-w-0">
                                                                                    <div className="font-mono text-xs truncate">
                                                                                        {path}
                                                                                    </div>
                                                                                    <div className="text-slate-500 text-xs truncate">
                                                                                        {details.summary}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </Button>
                                                                    )
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Schemas Section - Add to REST API tab */}
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm p-2"
                                onClick={() => toggleSection("schemas")}
                            >
                                <span className="flex items-center">
                                    <Database className="w-4 h-4 mr-2" />
                                    Data Models
                                </span>
                                <ChevronRight
                                    className={cn(
                                        "w-4 h-4 transition-transform duration-100",
                                        expandedSections.has("schemas")
                                            ? "transform rotate-90"
                                            : "transform rotate-0"
                                    )} />
                            </Button>

                            <div className={cn(
                                "ml-4 space-y-1 transition-all duration-100",
                                expandedSections.has("schemas")
                                    ? "max-h-[700px] overflow-y-auto"
                                    : "max-h-0 overflow-hidden"
                            )}>
                                {(() => {
                                    const schemas =
                                        apiSpec?.components?.schemas ||
                                        apiSpec?.definitions ||
                                        {};

                                    return Object.entries(schemas).map(
                                        ([schemaName, schemaDefinition]: [string, any]) => (
                                            <Button
                                                key={schemaName}
                                                className="w-full justify-start text-xs p-2 h-auto"
                                                onClick={() => {
                                                    updateHashPath(
                                                        `#SCHEMA-${schemaName}`
                                                    );
                                                }}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <div
                                                        className={cn(
                                                            "text-xs px-1.5 py-0.5 rounded font-medium border",
                                                            schemaDefinition.enum
                                                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                                                : schemaDefinition.allOf ||
                                                                    schemaDefinition.oneOf ||
                                                                    schemaDefinition.anyOf
                                                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                                                    : "bg-purple-50 border-purple-200 text-purple-700"
                                                        )}
                                                    >
                                                        {schemaDefinition.enum
                                                            ? "enum"
                                                            : schemaDefinition.allOf
                                                                ? "allOf"
                                                                : schemaDefinition.oneOf
                                                                    ? "oneOf"
                                                                    : schemaDefinition.anyOf
                                                                        ? "anyOf"
                                                                        : schemaDefinition.type || "object"}
                                                    </div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <div className="font-mono text-xs truncate font-medium">
                                                            {schemaName}
                                                        </div>
                                                        <div className="text-slate-500 text-xs truncate">
                                                            {schemaDefinition.description ||
                                                                (schemaDefinition.enum
                                                                    ? `${schemaDefinition.enum.length} values`
                                                                    : schemaDefinition.properties
                                                                        ? `${Object.keys(schemaDefinition.properties)
                                                                            .length
                                                                        } properties`
                                                                        : schemaDefinition.allOf
                                                                            ? `${schemaDefinition.allOf.length} schemas (all)`
                                                                            : schemaDefinition.oneOf
                                                                                ? `${schemaDefinition.oneOf.length} schemas (one)`
                                                                                : schemaDefinition.anyOf
                                                                                    ? `${schemaDefinition.anyOf.length} schemas (any)`
                                                                                    : "Schema definition")}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Button>
                                        )
                                    );
                                })()}

                                {/* Show message if no schemas found */}
                                {Object.keys(
                                    apiSpec?.components?.schemas || apiSpec?.definitions || {}
                                ).length === 0 && (
                                        <div className="text-xs text-slate-500 p-2 text-center">
                                            No schemas defined
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="font-bold">Socket Api</h3>
                        </div>

                        {/* SocketIO Section - Add to Socket API tab */}
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm p-2"
                                onClick={() => toggleSection("name-spaces")}
                            >
                                <span className="flex items-center">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Name Spaces
                                </span>
                                <ChevronRight
                                    className={cn(
                                        "w-4 h-4 transition-transform duration-100",
                                        expandedSections.has("name-spaces")
                                            ? "transform rotate-90"
                                            : "transform rotate-0"
                                    )}
                                />
                            </Button>

                            <div className={cn(
                                "ml-4 space-y-2 transition-all duration-100",
                                expandedSections.has("name-spaces")
                                    ? "max-h-[10000px] overflow-y-auto"
                                    : "max-h-0 overflow-hidden"
                            )}>
                                {
                                    socketApiSpec?.name_spaces?.map((ns: any) => (
                                        <div key={ns.name} className="space-y-1">
                                            <Button
                                                key={ns.name}
                                                className="w-full justify-between text-xs p-1.5 h-auto font-medium text-slate-700"
                                                onClick={() =>
                                                    toggleSection(`ns-${ns.name}`)
                                                }
                                            >

                                                <span className="flex items-center">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                                                    {ns.name}
                                                </span>
                                                {expandedSections.has(`ns-${ns.name}`) ? (
                                                    <ChevronDown className="w-3 h-3" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3" />
                                                )}
                                            </Button>


                                            <div className={cn(
                                                "ml-4 space-y-1 transition-all duration-100",
                                                expandedSections.has(`ns-${ns.name}`)
                                                    ? "max-h-[700px] overflow-y-auto"
                                                    : "max-h-0 overflow-hidden"
                                            )}>
                                                {ns.emits.map((emits: any) => (
                                                    <Button
                                                        key={emits.anme}
                                                        variant={
                                                            hashPath === `#SOCKET-${ns.name}-${emits.name}-listen`
                                                                ? "secondary"
                                                                : "ghost"
                                                        }
                                                        className="w-full justify-start text-xs p-2 h-auto"
                                                        onClick={() =>
                                                            updateHashPath(
                                                                `#SOCKET-${ns.name}-${emits.name}-listen`
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center gap-2 w-full">
                                                            <div
                                                                className={cn(
                                                                    "text-xs px-1.5 py-0.5 rounded font-medium border bg-green-100 text-green-800 border-green-200",
                                                                )}
                                                            >
                                                                {"Listen".toUpperCase()}
                                                            </div>
                                                            <div className="text-left flex-1 min-w-0">
                                                                <div className="font-mono text-xs truncate">
                                                                    {emits.name}
                                                                </div>
                                                                <div className="text-slate-500 text-xs truncate">
                                                                    {emits.description || "No description"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Button>
                                                ))}

                                                {
                                                    ns.listens.map((listen: any) => (
                                                        <Button
                                                            key={listen.anme}
                                                            variant={
                                                                hashPath === `#SOCKET-${ns.name}-${listen.name}-Emit`
                                                                    ? "secondary"
                                                                    : "ghost"
                                                            }
                                                            className="w-full justify-start text-xs p-2 h-auto"
                                                            onClick={() =>
                                                                updateHashPath(
                                                                    `#SOCKET-${ns.name}-${listen.name}-Emit`
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <div
                                                                    className={cn(
                                                                        "text-xs px-1.5 py-0.5 rounded font-medium border ",
                                                                        "bg-blue-100 text-blue-800 border-blue-200"
                                                                    )}
                                                                >
                                                                    {"Emit".toUpperCase()}
                                                                </div>
                                                                <div className="text-left flex-1 min-w-0">
                                                                    <div className="font-mono text-xs truncate">
                                                                        {listen.name}
                                                                    </div>
                                                                    <div className="text-slate-500 text-xs truncate">
                                                                        {listen.description || "No description"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-sm p-2"
                                onClick={() => toggleSection("socket-schemas")}
                            >
                                <span className="flex items-center">
                                    <Database className="w-4 h-4 mr-2" />
                                    Socket Data Models
                                </span>
                                <ChevronRight
                                    className={cn(
                                        "w-4 h-4 transition-transform duration-100",
                                        expandedSections.has("socket-schemas")
                                            ? "transform rotate-90"
                                            : "transform rotate-0"
                                    )}
                                />
                            </Button>

                            <div className={cn(
                                "ml-4 space-y-1 transition-all duration-100",
                                expandedSections.has("socket-schemas")
                                    ? "max-h-[700px] overflow-y-auto"
                                    : "max-h-0 overflow-hidden"
                            )}>


                            </div>


                        </div>




                        </div>
                    </div>

                    {/* footer */}
                    <footer className="p-3 border-t border-slate-200 text-xs flex items-center justify-between bg-white">
                        powered by nguyluky
                    </footer>
            </aside>
        </>
    );
}
