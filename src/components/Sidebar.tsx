import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useHashUrlPath from "@/hooks/useHashUrlPath";
import { useSocketManager } from "@/hooks/useSocketIO";
import { cn, getMethodColor } from "@/lib/utils";
import {
    ArrowRight,
    ChevronDown,
    ChevronRight,
    Database,
    FileText,
    Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    apiSpec: any;
    socketApiSpec: any;
}

interface SidebarHeaderProps {
    apiSpec: any;
    setSidebarCollapsed: (collapsed: boolean) => void;
}


interface ExpandableSectionProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    isExpanded: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}

interface EndpointsGroupProps {
    groupedEndpoints: any;
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

interface EndpointItemProps {
    path: string;
    method: string;
    details: any;
}

interface SchemaSectionProps {
    apiSpec: any;
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
    updateHashPath: (path: string) => void;
}

interface SocketSectionProps {
    socketApiSpec: any; // Will be SocketDocumentation
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

interface NamespaceItemProps {
    namespaceName: string;
    namespace: any; // Will be namespace from SocketDocumentation
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

interface SocketEventItemProps {
    eventName: string;
    event: any; // Will be event from SocketDocumentation
    namespaceName: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ apiSpec, setSidebarCollapsed }) => (
    <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">
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
);

const OverviewSection: React.FC = () => {
    const { hashPath, updateHashPath } = useHashUrlPath();
    return (

        <>
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
        </>
    )
};

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
    title,
    icon: Icon,
    isExpanded,
    onToggle,
    children
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(0);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <>
            <Button
                variant="ghost"
                className="w-full justify-between text-sm p-2"
                onClick={onToggle}
            >
                <span className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {title}
                </span>
                <ChevronRight
                    className={cn(
                        "w-4 h-4 transition-transform duration-100",
                        isExpanded ? "rotate-90" : "rotate-0"
                    )}
                />
            </Button>

            <div
                style={{
                    height: isExpanded ? `${height}px` : "0px",
                }}
                className={cn(
                    "ml-4 overflow-hidden transition-all duration-100 ease-in-out",
                    isExpanded ? "opacity-100" : "opacity-0"
                )}
            >
                <div ref={contentRef}>{children}</div>
            </div>
        </>
    );
};

const EndpointItem: React.FC<EndpointItemProps> = ({
    path,
    method,
    details,
}) => {
    const { hashPath, updateHashPath } = useHashUrlPath();

    return (
        <Button
            key={`${path}-${method}`}
            // variant={hashPath === `#REST-${path}_${method}` ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start text-xs p-2 h-auto",
                hashPath === `#REST-${path}_${method}`
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => updateHashPath(`#REST-${path}_${method}`)}
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
};

const EndpointsGroup: React.FC<EndpointsGroupProps> = ({
    groupedEndpoints,
    expandedSections,
    toggleSection,
}) => {
    return <>
        {Object.entries(groupedEndpoints).map(([tag, pathsForTag]) => (
            <ExpandableSection
                key={tag}
                title={tag}
                icon={() => (<div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />)}
                isExpanded={expandedSections.has(`tag-${tag}`)}
                onToggle={() => toggleSection(`tag-${tag}`)}
            >
                <div className="ml-4 space-y-1">
                    {Object.entries(pathsForTag!).map(([path, methods]) => (
                        <div key={path}>
                            {Object.entries(methods as any).map(([method, details]: [string, any]) => (
                                <EndpointItem
                                    key={`${path}-${method}`}
                                    path={path}
                                    method={method}
                                    details={details}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </ExpandableSection>
        ))}
    </>
};

const SchemaSection: React.FC<SchemaSectionProps> = ({
    apiSpec,
    expandedSections,
    toggleSection,
    updateHashPath
}) => {
    const schemas = apiSpec?.components?.schemas || apiSpec?.definitions || {};

    return (
        <>
            <ExpandableSection
                title="Data Models"
                icon={Database}
                isExpanded={expandedSections.has("schemas")}
                onToggle={() => toggleSection("schemas")}
            >
                {Object.entries(schemas).map(([schemaName, schemaDefinition]: [string, any]) => (
                    <Button
                        key={schemaName}
                        className="w-full justify-start text-xs p-2 h-auto"
                        onClick={() => updateHashPath(`#SCHEMAS-${schemaName}`)}
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
                                                ? `${Object.keys(schemaDefinition.properties).length} properties`
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
                ))}

                {Object.keys(schemas).length === 0 && (
                    <div className="text-xs text-slate-500 p-2 text-center">
                        No schemas defined
                    </div>
                )}
            </ExpandableSection>
        </>
    );
};

const SocketEventItem: React.FC<SocketEventItemProps> = ({
    eventName,
    event,
    namespaceName,
}) => {
    const { hashPath, updateHashPath } = useHashUrlPath();
    
    // Determine badge label and color based on direction
    const getBadgeInfo = (direction: string) => {
        switch (direction) {
            case 'client-to-server':
                return { label: 'EMIT', className: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'server-to-client':
                return { label: 'LISTEN', className: 'bg-green-100 text-green-800 border-green-200' };
            case 'bidirectional':
                return { label: 'BOTH', className: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'server-emit-only':
                return { label: 'SERVER', className: 'bg-orange-100 text-orange-800 border-orange-200' };
            case 'client-listen-only':
                return { label: 'CLIENT', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            default:
                return { label: 'EVENT', className: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    };

    const badgeInfo = getBadgeInfo(event.direction);
    const hashPathTarget = `#SOCKET-${namespaceName}-${eventName}-${event.direction}`;

    return (
        <Button
            key={eventName}
            className={cn(
                "w-full justify-start text-xs p-2 h-auto",
                hashPath === hashPathTarget
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => updateHashPath(hashPathTarget)}
        >
            <div className="flex items-center gap-2 w-full">
                <div
                    className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium border",
                        badgeInfo.className
                    )}
                >
                    {badgeInfo.label}
                </div>
                <div className="text-left flex-1 min-w-0">
                    <div className="font-mono text-xs truncate">
                        {eventName}
                    </div>
                    <div className="text-slate-500 text-xs truncate">
                        {event.description || "No description"}
                    </div>
                    {event.deprecated && (
                        <div className="text-red-500 text-xs">
                            Deprecated
                        </div>
                    )}
                </div>
            </div>
        </Button>
    );
};

const NamespaceItem: React.FC<NamespaceItemProps> = ({
    namespaceName,
    namespace,
    expandedSections,
    toggleSection,
}) => {
    const { connected } = useSocketManager();
    
    return (
        <div className="space-y-1">
            <Button
                className="w-full justify-between text-xs p-1.5 h-auto font-medium text-slate-700"
                onClick={() => toggleSection(`ns-${namespaceName}`)}
            >
                <span className="flex items-center">
                    <div className={cn(
                        "w-2 h-2 bg-red-500 rounded-full mr-2",
                        connected.get(namespaceName) ? "bg-green-500" : "bg-red-500"
                    )} />
                    {namespaceName}
                </span>
                {expandedSections.has(`ns-${namespaceName}`) ? (
                    <ChevronDown className="w-3 h-3" />
                ) : (
                    <ChevronRight className="w-3 h-3" />
                )}
            </Button>

            <div className={cn(
                "ml-4 space-y-1 transition-all duration-100",
                expandedSections.has(`ns-${namespaceName}`)
                    ? "max-h-[700px] overflow-y-auto"
                    : "max-h-0 overflow-hidden"
            )}>
                {/* Render events from the new structure */}
                {Object.entries(namespace.events || {}).map(([eventName, event]: [string, any]) => (
                    <SocketEventItem
                        key={eventName}
                        eventName={eventName}
                        event={event}
                        namespaceName={namespaceName}
                    />
                ))}

                {/* Show message if no events */}
                {Object.keys(namespace.events || {}).length === 0 && (
                    <div className="text-xs text-slate-500 p-2 text-center">
                        No events defined
                    </div>
                )}
            </div>
        </div>
    );
};

const SocketSection: React.FC<SocketSectionProps> = ({
    socketApiSpec,
    expandedSections,
    toggleSection,
}) => {
    const { updateHashPath } = useHashUrlPath();
    
    // Handle both old and new structure
    const namespaces = socketApiSpec?.namespaces || {};
    const hasOldStructure = socketApiSpec?.name_spaces;
    
    return (
        <>
            <ExpandableSection
                title="Namespaces"
                icon={Zap}
                isExpanded={expandedSections.has("namespaces")}
                onToggle={() => toggleSection("namespaces")}
            >
                {/* New structure: SocketDocumentation.namespaces */}
                {Object.entries(namespaces).map(([namespaceName, namespace]: [string, any]) => (
                    <NamespaceItem
                        key={namespaceName}
                        namespaceName={namespaceName}
                        namespace={namespace}
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                    />
                ))}

                {/* Fallback for old structure */}
                {hasOldStructure && socketApiSpec.name_spaces?.map((ns: any) => (
                    <NamespaceItem
                        key={ns.name}
                        namespaceName={ns.name}
                        namespace={{
                            description: ns.description,
                            auth: ns.auth,
                            events: [
                                ...ns.emits?.map((emit: any) => ({ ...emit, direction: 'client-to-server' })) || [],
                                ...ns.listens?.map((listen: any) => ({ ...listen, direction: 'server-to-client' })) || []
                            ].reduce((acc: any, event: any) => {
                                acc[event.name] = event;
                                return acc;
                            }, {})
                        }}
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                    />
                ))}

                {/* Show message if no namespaces */}
                {Object.keys(namespaces).length === 0 && !hasOldStructure && (
                    <div className="text-xs text-slate-500 p-2 text-center">
                        No namespaces defined
                    </div>
                )}
            </ExpandableSection>

            <ExpandableSection
                title="Socket Data Models"
                icon={Database}
                isExpanded={expandedSections.has("socket-schemas")}
                onToggle={() => toggleSection("socket-schemas")}
            >
                {socketApiSpec.components?.schemas && (
                    Object.entries(socketApiSpec.components.schemas).map(([key_name, schema]) => (
                        <Button
                            key={key_name}
                            className="w-full justify-start text-xs p-2 h-auto"
                            onClick={() => {
                                const schemaPath = `#SOCEMA-${key_name}`;
                                updateHashPath(schemaPath);
                            }}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <div className="text-xs px-1.5 py-0.5 rounded font-medium border bg-purple-50 border-purple-200 text-purple-700">
                                    {(schema as any).type || "object"}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-mono text-xs truncate font-medium">
                                        {String(key_name)}
                                    </div>
                                    <div className="text-slate-500 text-xs truncate">
                                        {(schema as any).description || "No description"}
                                    </div>
                                </div>
                            </div>
                        </Button>
                    ))
                )}

                {/* Show message if no schemas */}
                {!socketApiSpec.components?.schemas && (
                    <div className="text-xs text-slate-500 p-2 text-center">
                        No schemas defined
                    </div>
                )}
            </ExpandableSection>
        </>
    );
};

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
            // Expand socket sections based on hashPath
            const namespaceName = pathParts[1];
            openSection("namespaces");
            openSection(`ns-${namespaceName}`);
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
                        <Separator />

                        {/* Project Info */}
                        <SidebarHeader
                            apiSpec={apiSpec}
                            setSidebarCollapsed={setSidebarCollapsed}
                        />

                        {/* Overview */}
                        <OverviewSection />

                        {/* Swagger API */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="font-bold">Swagger Api</h3>
                        </div>

                        <div className="space-y-2">
                            <ExpandableSection
                                title="Endpoints"
                                icon={FileText}
                                isExpanded={expandedSections.has("endpoints")}
                                onToggle={() => toggleSection("endpoints")}
                            >
                                <EndpointsGroup
                                    groupedEndpoints={groupedEndpoints}
                                    expandedSections={expandedSections}
                                    toggleSection={toggleSection}
                                />
                            </ExpandableSection>

                            <SchemaSection
                                apiSpec={apiSpec}
                                expandedSections={expandedSections}
                                toggleSection={toggleSection}
                                updateHashPath={updateHashPath}
                            />
                        </div>

                        {/* Socket API */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="font-bold">Socket Api</h3>
                        </div>

                        <div className="space-y-2">
                            <SocketSection
                                socketApiSpec={socketApiSpec}
                                expandedSections={expandedSections}
                                toggleSection={toggleSection}
                            />
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
