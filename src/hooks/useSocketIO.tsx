import type { Socket as SocketIO } from "socket.io-client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type SocketManagerProviderProps = {
    children: ReactNode;
};


type SocketManagerContextType = {
    sockets: Map<string, SocketIO>;
    history: Map<string, SocketMessage[]>;
    connected: Map<string, boolean>;
    setHistory: React.Dispatch<React.SetStateAction<Map<string, SocketMessage[]>>>;
    addSocket: (name: string, socket: SocketIO) => void;
    removeSocket: (name: string) => void;
    addEventListener: (name: string, event: string, callback: (...args: any[]) => void) => void;
    removeEventListener: (name: string, event: string) => void;
};

const SocketManagerContext = createContext<SocketManagerContextType | undefined>(undefined);

export interface SocketMessage {
    id: string;
    type: "sent" | "received" | "error" | "info";
    event: string;
    data: any;
    timestamp: Date;
}

export function SocketManagerProvider({ children }: SocketManagerProviderProps) {
    const [sockets, setSockets] = useState<Map<string, SocketIO>>(new Map());
    const [eventListeners, setEventListeners] = useState<Map<string, (...args: any[]) => void>>(new Map());
    const [history, setHistory] = useState<Map<string, SocketMessage[]>>(new Map());
    const [connected, setConnected] = useState<Map<string, boolean>>(new Map());

    const anyEventListenerHandler = (name: string, event: string, ...args: any[]) => {
        const eventNameSpace = `${name}-${event}`;
        const callback = eventListeners.get(eventNameSpace);
        if (callback) {
            callback(...args);
        } else {
            console.warn(`No event listener found for ${eventNameSpace}`);
        }
    }

    const addSocket = (name: string, socket: SocketIO) => {
        setSockets((prev) => new Map(prev).set(name, socket));
        setConnected((prev) => new Map(prev).set(name, false));
        socket.onAny((event, ...args) => {
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'received',
                event,
                data: args,
                timestamp: new Date(),
            };
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(name) || [];
                currentHistory.push(message);
                newHistory.set(name, currentHistory);
                return newHistory;
            });

            console.log(`Socket event received: ${name} - ${event}`, args);
            anyEventListenerHandler(name, event, ...args);
        });

        socket.on("connect", () => {
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'info',
                event: 'connect',
                data: [],
                timestamp: new Date(),
            };
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(name) || [];
                currentHistory.push(message);
                newHistory.set(name, currentHistory);
                return newHistory;
            });
            setConnected((prev) => new Map(prev).set(name, true));
            console.log(`Socket opened: ${name}`);
        });

        socket.on("disconnect", () => {
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'info',
                event: 'disconnect',
                data: [],
                timestamp: new Date(),
            };
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(name) || [];
                currentHistory.push(message);
                newHistory.set(name, currentHistory);
                return newHistory;
            });
            console.log(`Socket disconnected: ${name}`);
            removeSocket(name);
        });

        socket.on("connect_error" , (error) => {
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'error',
                event: error.message,
                data: [error],
                timestamp: new Date(),
            };
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(name) || [];
                currentHistory.push(message);
                newHistory.set(name, currentHistory);
                return newHistory;
            });
            console.error(`Socket error for ${name}:`, error);
            removeSocket(name);
        });

        socket.io.on("error", (error) => {
            const message: SocketMessage = {
                id: crypto.randomUUID(),
                type: 'error',
                event: error.message,
                data: [error],
                timestamp: new Date(),
            };
            setHistory((prev) => {
                const newHistory = new Map(prev);
                const currentHistory = newHistory.get(name) || [];
                currentHistory.push(message);
                newHistory.set(name, currentHistory);
                return newHistory;
            });
            console.error(`Socket connection error for ${name}:`, error);
            removeSocket(name);
        });

        socket.connect();
    };

    const removeSocket = (name: string) => {
        setConnected((prev) => {
            const new_ = new Map(prev);
            new_.delete(name);
            return new_
        });
        setSockets((prev) => {
            const newSockets = new Map(prev);
            const socket = newSockets.get(name);
            socket?.disconnect();
            newSockets.delete(name);
            return newSockets;
        });
    };


    const addEventListener = (name: string, event: string, callback: (...args: any[]) => void) => {
        const eventNameSpace = `${name}-${event}`;
        setEventListeners((prev) => new Map(prev).set(eventNameSpace, callback));
    }

    const removeEventListener = (name: string, event: string) => {
        const eventNameSpace = `${name}-${event}`;
        setEventListeners((prev) => {
            const newListeners = new Map(prev);
            newListeners.delete(eventNameSpace);
            return newListeners;
        });
    }


    return (
        <SocketManagerContext.Provider value={{
            sockets, addSocket, removeSocket, addEventListener, removeEventListener, history, setHistory, connected
        }}>
            {children}
        </SocketManagerContext.Provider>
    );
}

export function useSocketManager() {
    const context = useContext(SocketManagerContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}

