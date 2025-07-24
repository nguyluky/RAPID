import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import useHashUrlPath from "@/hooks/useHashUrlPath"
import { cn, getMethodColor } from "@/lib/utils"
import { Search } from "lucide-react"
// modals provider

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type ModalsProviderProps = {
    children: ReactNode;
};

type ModalName = "auth" | "search" | null;

type ModalsContextType = {
    setOpenModal: (module: ModalName) => void;
    modalOpen: ModalName;
};

const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: ModalsProviderProps) {
    const [modalOpen, setOpenModal] = useState<ModalName>(null);

    return (
        <ModalsContext.Provider value={{ modalOpen, setOpenModal }}>
            {children}
        </ModalsContext.Provider>
    );
}

export function useModals() {
    const context = useContext(ModalsContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}


interface ModalsProps {
    apiSpec: any
    asyncApiSpec: any
    setAuthToken: (token: string) => void
}

export default function Modals({
    apiSpec,
    asyncApiSpec,
    setAuthToken,
}: ModalsProps) {

    const { modalOpen, setOpenModal } = useModals();
    const [authToken, setAuthTokenState] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { hashPath, updateHashPath } = useHashUrlPath();

    const performSearch = (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        const results = [];

        // Search REST endpoints
        for (const path in apiSpec.paths) {
            for (const method in apiSpec.paths[path]) {
                const endpoint = apiSpec.paths[path][method];
                if (endpoint.summary?.toLowerCase().includes(query.toLowerCase()) ||
                    endpoint.description?.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        id: `${path}_${method}`,
                        type: "rest",
                        title: endpoint.summary || "No summary",
                        subtitle: `${method.toUpperCase()} ${path}`,
                        description: endpoint.description || "",
                        method
                    });
                }
            }
        }

        // Search AsyncAPI channels
        for (const channel in asyncApiSpec.channels) {
            const channelData = asyncApiSpec.channels[channel];
            if (channelData.description?.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    id: channel,
                    type: "socket",
                    title: channelData.summary || "No summary",
                    subtitle: `Channel: ${channel}`,
                    description: channelData.description || "",
                    method: channelData.publish ? "PUBLISH" : "SUBSCRIBE"
                });
            }
        }

        setSearchResults(results);
    }


    // handle keyboard shortcuts
    useEffect(() => {

        const handleKeyDown = (e: KeyboardEvent) => {
            // ctrl + k : open search modal

            if (e.ctrlKey && e.key === "k") {
                e.preventDefault();
                setOpenModal("search");
            }

            // esc : close any open modal
            if (e.key === "Escape") {
                e.preventDefault();
                setOpenModal(null);
            }

            // arrow up/down : navigate search results


        }


        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, [])

    return (
        <>
            {/* Auth Modal */}
            {modalOpen == "auth" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-[400px] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Authentication</h3>
                            <Button variant="ghost" size="sm" onClick={() => setOpenModal(null)}>
                                ×
                            </Button>
                        </div>

                        <div className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium mb-2">Token/Key</label>
                                <Input
                                    type="password"
                                    placeholder="Enter your token or API key"
                                    value={authToken}
                                    onChange={(e) => setAuthTokenState(e.target.value)}
                                />
                            </div>

                            <div className="text-xs text-slate-500">
                                <p>
                                    <strong>Bearer Token:</strong> Will be sent as "Authorization: Bearer {authToken}"
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={() => {
                                    setOpenModal(null)
                                    setAuthToken(authToken)
                                }} className="flex-1">
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAuthToken("")
                                        setAuthTokenState("")
                                        setOpenModal(null)
                                    }}
                                    className="flex-1"
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Modal */}
            {modalOpen == "search" && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-4 lg:pt-20 z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-[600px] max-h-[80vh] lg:max-h-[70vh] overflow-hidden">
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search endpoints and channels..."
                                    className="pl-10 w-full"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        performSearch(e.target.value)
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <ScrollArea className="max-h-96">
                            {searchResults.length === 0 && searchQuery ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>No results found for "{searchQuery}"</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Start typing to search endpoints and channels...</p>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {searchResults.map((result) => (
                                        <button
                                            key={result.id}
                                            className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                            onClick={() => {
                                                // if (result.type === "rest") {
                                                //     setActiveSection("rest")
                                                //     setSelectedEndpoint(result.id)
                                                // } else {
                                                //     setActiveSection("socket")
                                                //     setSelectedSocketEvent(result.id)
                                                // }
                                                // setShowSearchModal(false)
                                                setSearchQuery("")
                                                // updateHashPath(
                                                //     `#REST-${path}_${method}`
                                                // )

                                                updateHashPath(
                                                    result.type === "rest"
                                                        ? `#REST-${result.id}`
                                                        : `#SOCKET-${result.id}`
                                                )
                                                setOpenModal(null)
                                            }}
                                        >
                                            <div className="flex items-center gap-3 mb-1">
                                                <div
                                                    className={cn(
                                                        "text-xs px-2 py-1 rounded font-medium border",
                                                        result.method === "PUBLISH" || result.method === "SUBSCRIBE"
                                                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                                            : getMethodColor(result.method)
                                                    )}
                                                >
                                                    {result.method}
                                                </div>
                                                <span className="font-medium text-slate-900">{result.title}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 mb-1">{result.subtitle}</div>
                                            {result.description && <div className="text-xs text-slate-500">{result.description}</div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-3 border-t bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                            <Button variant="ghost" size="sm" onClick={() => setOpenModal(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </>
    )
}
