import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import useHashUrlPath from "@/hooks/useHashUrlPath"
import { useSocketManager, type SocketMessage } from "@/hooks/useSocketIO"
import { cn, generateExample } from "@/lib/utils"
import { Copy, Send, Shield, Trash, Wifi, WifiOff, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import JsonSchemaViewer from "./jsonSchemaView"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export const SocketEventType = {
    CLIENT_TO_SERVER: 'client-to-server',        // Client gửi, server nhận
    SERVER_TO_CLIENT: 'server-to-client',        // Server gửi, client nhận  
    BIDIRECTIONAL: 'bidirectional',              // Cả hai chiều
    SERVER_EMIT_ONLY: 'server-emit-only',        // Chỉ server emit (như notifications)
    CLIENT_LISTEN_ONLY: 'client-listen-only'     // Chỉ client listen
} as const;

export type SocketEventType = typeof SocketEventType[keyof typeof SocketEventType];

export interface SocketEventInfo {
    eventName: string;
    direction: SocketEventType; // Changed from 'type' to 'direction' to match existing structure
    description?: string;
    requestSchema?: any;
    responseSchema?: any;
    example?: any;
    deprecated?: boolean;
    acknowledgment?: boolean; // Có cần ACK không
}

export const SecuritySchemeType = {
    HTTP: 'http',
    API_KEY: 'apiKey',
    OAUTH2: 'oauth2',
    OPEN_ID_CONNECT: 'openIdConnect'
} as const;

export type SecuritySchemeType = typeof SecuritySchemeType[keyof typeof SecuritySchemeType];

abstract class SecurityScheme {
    type: SecuritySchemeType;
    description?: string;

    constructor(type: SecuritySchemeType, description?: string) {
        this.type = type;
        this.description = description;
    }

    // Phương thức trừu tượng validate
    abstract validate(req: Request): Promise<any | null>;

    // Phương thức trừu tượng validated để xác thực với token
    abstract validated(token: string): Promise<any | null>;
}

interface SocketDocumentation {
    namespaces: {
        [path: string]: {
            description?: string;
            auth?: SecurityScheme[];
            events: {
                [eventName: string]: {
                    direction: SocketEventType;
                    description?: string;
                    requestSchema?: any;
                    responseSchema?: any;
                    example?: any;
                    deprecated?: boolean;
                    acknowledgment?: boolean;
                };
            };
        };
    };
    servers?: Array<{ url: string }>;
}

interface SocketSectionProps {
    socketSpec: SocketDocumentation;
}

export default function SocketSection({ socketSpec }: SocketSectionProps) {
    const namespaces = socketSpec.namespaces || {};
    const { hashPath } = useHashUrlPath();
    const [_, namespaceKey = '', selectedEvent = ''] = hashPath.split("-");
    
    const [connectionUrl, setConnectionUrl] = useState(socketSpec.servers?.[0]?.url || "");
    const [messagePayload, setMessagePayload] = useState("");
    const [authToken, setAuthToken] = useState("");
    
    const { sockets, addSocket, removeSocket, history, setHistory, connected } = useSocketManager();
    
    const currentNamespace = namespaces[namespaceKey] || {};
    const currentEvent = currentNamespace.events?.[selectedEvent] || {};
    const isConnected = connected.get(namespaceKey) || false;
    const socket = sockets.get(namespaceKey);

    useEffect(() => {
        if (currentEvent.example) {
            setMessagePayload(JSON.stringify(currentEvent.example, null, 2));
        } else {
            setMessagePayload("");
        }
    }, [currentEvent]);

    // Check if authentication is required for current namespace
    const isAuthRequired = () => {
        return currentNamespace.auth && currentNamespace.auth.length > 0;
    };

    // Get auth scheme types for current namespace
    const getAuthSchemes = () => {
        if (!currentNamespace.auth) return [];
        return currentNamespace.auth.map((a: SecurityScheme) => a.type);
    };

    // Auto-validate auth requirements when namespace changes
    useEffect(() => {
        if (isAuthRequired() && !authToken && socket && isConnected) {
            console.warn(`Authentication required for namespace ${namespaceKey}. Please provide a token.`);
        }
    }, [namespaceKey, authToken, socket, isConnected, currentNamespace.auth]);

    const handleConnect = () => {
        // Pre-connection auth validation
        if (isAuthRequired() && !authToken) {
            const authSchemes = getAuthSchemes().join(", ");
            const shouldContinue = confirm(
                `This namespace requires authentication (${authSchemes}). ` +
                `Do you want to connect without a token? Connection may fail.`
            );
            if (!shouldContinue) {
                return;
            }
        }

        if (!connectionUrl) {
            alert("Please enter a server URL");
            return;
        }

        const fullUrl = connectionUrl + namespaceKey;
        
        if (socket && isConnected) {
            removeSocket(namespaceKey);
        } else {
            // Prepare auth object based on namespace security schemes
            let authObject: any = undefined;
            
            if (currentNamespace.auth && currentNamespace.auth.length > 0) {
                authObject = {};
                
                // Check for HTTP Bearer token authentication
                const httpAuth = currentNamespace.auth.find((a: SecurityScheme) => a.type === SecuritySchemeType.HTTP);
                if (httpAuth && authToken) {
                    authObject.token = authToken;
                    authObject.authorization = `Bearer ${authToken}`;
                }
                
                // Check for API Key authentication
                const apiKeyAuth = currentNamespace.auth.find((a: SecurityScheme) => a.type === SecuritySchemeType.API_KEY);
                if (apiKeyAuth && authToken) {
                    authObject.apiKey = authToken;
                }
                
                // If no auth token provided but auth is required, show warning
                if (!authToken) {
                    console.warn(`Authentication required for namespace ${namespaceKey} but no token provided`);
                    authObject.warning = "Authentication required but no token provided";
                }
            }
            
            const newSocket = io(fullUrl, { 
                autoConnect: false,
                auth: authObject,
                // Add additional auth headers if needed
                extraHeaders: authObject && authToken ? {
                    'Authorization': `Bearer ${authToken}`
                } : undefined
            });
            
            // Setup event listeners for all events in this namespace
            Object.keys(currentNamespace.events || {}).forEach(eventName => {
                const event = currentNamespace.events[eventName];
                if (event.direction === SocketEventType.SERVER_TO_CLIENT) {
                    newSocket.on(eventName, (data) => {
                        const message: SocketMessage = {
                            id: crypto.randomUUID(),
                            type: 'received',
                            event: eventName,
                            data: [data],
                            timestamp: new Date(),
                        };
                        setHistory((prev) => {
                            const newHistory = new Map(prev);
                            const currentHistory = newHistory.get(namespaceKey) || [];
                            currentHistory.push(message);
                            newHistory.set(namespaceKey, currentHistory);
                            return newHistory;
                        });
                    });
                }
            });

            addSocket(namespaceKey, newSocket);
        }
    };

    const handleSendMessage = () => {
        if (!socket || !isConnected) {
            alert("Please connect to the socket first.");
            return;
        }

        if (currentEvent.direction !== SocketEventType.CLIENT_TO_SERVER && 
            currentEvent.direction !== SocketEventType.BIDIRECTIONAL) {
            alert("This event does not support sending messages from client.");
            return;
        }

        try {
            const data = JSON.parse(messagePayload);
            socket.emit(selectedEvent, data);
            
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'sent',
                event: selectedEvent,
                data: [data],
                timestamp: new Date(),
            };
            
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(namespaceKey) || [];
                currentHistory.push(message);
                newHistory.set(namespaceKey, currentHistory);
                return newHistory;
            });
        } catch (error) {
            console.error("Invalid JSON:", error);
            alert("Invalid JSON format. Please check your input.");
        }
    };

    const clearHistory = () => {
        setHistory((prev) => {
            const newHistory = new Map(prev);
            newHistory.delete(namespaceKey);
            return newHistory;
        });
    };

    const getSchemaForEvent = () => {
        if (currentEvent.direction === SocketEventType.CLIENT_TO_SERVER) {
            return currentEvent.requestSchema;
        }
        return currentEvent.responseSchema;
    };

    return (
        <div className="h-full flex flex-col xl:flex-row overflow-hidden">
            {/* Left Panel - Event Documentation */}
            <div className="flex-1 xl:w-1/2 xl:border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                        {namespaceKey} - {selectedEvent}
                    </h3>
                    <span className="text-xs text-slate-500">
                        {currentEvent.direction === SocketEventType.CLIENT_TO_SERVER ? "Emit" : 
                         currentEvent.direction === SocketEventType.SERVER_TO_CLIENT ? "Listen" :
                         currentEvent.direction === SocketEventType.BIDIRECTIONAL ? "Both" :
                         currentEvent.direction === SocketEventType.SERVER_EMIT_ONLY ? "Server Only" :
                         currentEvent.direction === SocketEventType.CLIENT_LISTEN_ONLY ? "Client Only" : "Event"}
                    </span>
                </div>

                {/* Event Details */}
                <div className="flex-1 overflow-y-auto">
                    {selectedEvent && currentEvent.direction ? (
                        <div className="p-4">

                            {/* Auth info */}
                            {currentNamespace.auth && currentNamespace.auth.length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-800">Authentication Required</span>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-1">
                                        {currentNamespace.auth.map((a: SecurityScheme) => a.type).join(", ")}
                                    </p>
                                </div>
                            )}

                            {/* Event Description */}
                            {currentEvent.description && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                                    <p className="text-sm text-slate-600">{currentEvent.description}</p>
                                </div>
                            )}

                            {/* Deprecated Warning */}
                            {currentEvent.deprecated && (
                                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-red-800">Deprecated Event</span>
                                    </div>
                                    <p className="text-xs text-red-600 mt-1">This event is deprecated and may be removed in future versions.</p>
                                </div>
                            )}

                            {/* Schema */}
                            <div className="mb-4">
                                <h4 className="font-medium text-slate-900 mb-3">Schema</h4>
                                <JsonSchemaViewer schema={getSchemaForEvent() || {}} />
                            </div>

                            {/* Example Data */}
                            {currentEvent.example && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-slate-900 mb-3">Example Data</h4>
                                    <div className="bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="p-4">
                                            <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                                {JSON.stringify(currentEvent.example, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Interactive Section for Client-to-Server and Bidirectional */}
                            {(currentEvent.direction === SocketEventType.CLIENT_TO_SERVER || 
                              currentEvent.direction === SocketEventType.BIDIRECTIONAL) && (
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-slate-900">Send Message</h4>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setMessagePayload(JSON.stringify(generateExample(currentEvent.requestSchema), null, 2))}
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                Generate Example
                                            </Button>
                                    </div>
                                    <Textarea
                                        value={messagePayload}
                                        onChange={(e) => setMessagePayload(e.target.value)}
                                        placeholder={currentEvent.example ? JSON.stringify(currentEvent.example, null, 2) : "{}"}
                                        className="min-h-[120px] font-mono text-sm mb-3"
                                    />
                                    <Button 
                                        onClick={handleSendMessage} 
                                        disabled={!isConnected}
                                        className="w-full"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Select an Event</h3>
                                <p className="text-slate-500 text-sm">
                                    Choose an event from the sidebar to view its details and interact with it
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Connection & Logs */}
            <div className="flex-1 xl:w-1/2 flex flex-col bg-slate-50">
                <div className="border-b border-slate-200 p-4 bg-white">
                    <h3 className="font-semibold text-slate-900">Connection & Logs</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Connection Section */}
                    <div className="bg-white rounded-lg border shadow-sm border-slate-200">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                            <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                                Connection
                            </h4>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Server URL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Server URL</label>
                                <Select value={connectionUrl} onValueChange={setConnectionUrl}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select server URL" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {socketSpec.servers?.map((server: { url: string }) => (
                                            <SelectItem key={server.url} value={server.url}>
                                                {server.url}{namespaceKey}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Auth Token */}
                            {isAuthRequired() && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">
                                            Authentication Token
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <span className="text-xs text-slate-500">
                                            {getAuthSchemes().join(", ")}
                                        </span>
                                    </div>
                                    <Textarea
                                        value={authToken}
                                        onChange={(e) => setAuthToken(e.target.value)}
                                        placeholder={
                                            getAuthSchemes().includes(SecuritySchemeType.HTTP) 
                                                ? "Bearer token..." 
                                                : getAuthSchemes().includes(SecuritySchemeType.API_KEY)
                                                ? "API Key..."
                                                : "Authentication token..."
                                        }
                                        className={cn(
                                            "font-mono text-sm",
                                            !authToken && "border-red-300 focus:border-red-500"
                                        )}
                                        rows={2}
                                    />
                                    {!authToken && (
                                        <p className="text-xs text-red-600">
                                            Authentication token is required for this namespace
                                        </p>
                                    )}
                                </div>
                            )}

                            <Button 
                                onClick={handleConnect}
                                variant={isConnected ? "destructive" : "default"}
                                className={cn(
                                    "w-full",
                                    !isConnected && isAuthRequired() && !authToken && "border-red-300"
                                )}
                                disabled={!isConnected && isAuthRequired() && !authToken}
                            >
                                {isConnected ? (
                                    <>
                                        <WifiOff className="w-4 h-4 mr-2" />
                                        Disconnect
                                    </>
                                ) : (
                                    <>
                                        <Wifi className="w-4 h-4 mr-2" />
                                        {isAuthRequired() && !authToken ? "Auth Required" : "Connect"}
                                    </>
                                )}
                            </Button>

                            {/* Auth Status Indicator */}
                            {isAuthRequired() && (
                                <div className={cn(
                                    "p-2 rounded-lg text-xs",
                                    authToken 
                                        ? "bg-green-50 text-green-700 border border-green-200" 
                                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                )}>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3 h-3" />
                                        {authToken 
                                            ? "Authentication token provided" 
                                            : "Authentication token required for this namespace"
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Logs */}
                    <div className="bg-white rounded-lg border shadow-sm border-slate-200 flex-1 flex flex-col">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">Message Log</h4>
                            <Button variant="ghost" size="sm" onClick={clearHistory}>
                                <Trash className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                {history.get(namespaceKey)?.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={cn(
                                            "p-3 rounded-lg border text-sm",
                                            msg.type === 'sent' && "bg-blue-50 border-blue-200",
                                            msg.type === 'received' && "bg-green-50 border-green-200",
                                            msg.type === 'error' && "bg-red-50 border-red-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={msg.type === 'sent' ? 'default' : 'secondary'}>
                                                    {msg.type}
                                                </Badge>
                                                <span className="font-medium">{msg.event}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <pre className="text-xs text-slate-700 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border">
                                            {JSON.stringify(msg.data, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                                {(!history.get(namespaceKey) || history.get(namespaceKey)?.length === 0) && (
                                    <div className="text-center text-slate-500 py-8">
                                        <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No messages yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


