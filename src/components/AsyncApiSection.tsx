"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import useHashUrlPath from "@/hooks/useHashUrlPath"
import { cn } from "@/lib/utils"
import { Pause, Play, Send, Wifi, WifiOff, Zap } from "lucide-react"
import { useState } from "react"
import JsonSchemaViewer from "./jsonSchemaView"

interface AsyncApiSectionProps {
    asyncApiSpec: any
    socketConnected?: boolean
    socketUrl?: string
    setSocketUrl?: (url: string) => void
    connectSocket?: () => void
    disconnectSocket?: () => void
    emitSocketEvent?: (event: string) => void
    socketPayload?: string
    setSocketPayload?: (payload: string) => void
    listeningEvents?: Set<string>
    toggleEventListener?: (event: string) => void
    socketMessages?: any[]
    setSocketMessages?: (messages: any[]) => void
}

export default function AsyncApiSection({
    asyncApiSpec,
    socketConnected = false,
    socketUrl = "",
    setSocketUrl = () => { },
    connectSocket = () => { },
    disconnectSocket = () => { },
    emitSocketEvent = () => { },
    socketPayload = "{}",
    setSocketPayload = () => { },
    listeningEvents = new Set(),
    toggleEventListener = () => { },
    socketMessages = [],
    setSocketMessages = () => { }
}: AsyncApiSectionProps) {
    const { hashPath, updateHashPath } = useHashUrlPath()
    const selectedChannel = hashPath.replace('#AsyncAPI-', '')

    const channels = asyncApiSpec?.channels || {}
    const channelNames = Object.keys(channels)

    const [activeTab, setActiveTab] = useState<'channels' | 'messages'>('channels')

    const handleChannelClick = (channelName: string) => {
        const newPath = selectedChannel === channelName ? '#AsyncAPI' : `#AsyncAPI-${channelName}`
        updateHashPath(newPath)
    }

    const generateMessageExample = (messageSchema: any): any => {
        if (!messageSchema || !messageSchema.payload) return {}

        const generateFromSchema = (schema: any): any => {
            if (!schema) return null

            switch (schema.type) {
                case 'object':
                    const example: any = {}
                    if (schema.properties) {
                        Object.keys(schema.properties).forEach(key => {
                            example[key] = generateFromSchema(schema.properties[key])
                        })
                    }
                    return example
                case 'array':
                    return schema.items ? [generateFromSchema(schema.items)] : []
                case 'string':
                    return schema.enum ? schema.enum[0] : schema.example || "string"
                case 'number':
                case 'integer':
                    return schema.example || 0
                case 'boolean':
                    return schema.example || true
                default:
                    return schema.example || null
            }
        }

        return generateFromSchema(messageSchema.payload)
    }

    const selectedChannelData = selectedChannel ? channels[selectedChannel] : null
    const canPublish = selectedChannelData?.publish
    const canSubscribe = selectedChannelData?.subscribe

    return (
        <div className="h-full flex flex-col xl:flex-row overflow-hidden">
            {/* Left Panel - Channels List & Channel Details */}
            <div className="flex-1 xl:w-1/2 xl:border-r border-slate-200 flex flex-col">
                {/* Channels List */}
                {/* <div className="border-b border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">AsyncAPI Channels ({channelNames.length})</h2>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                socketConnected ? "bg-green-500" : "bg-red-500"
                            )}></div>
                            <span className="text-xs text-slate-500">
                                {socketConnected ? "Connected" : "Disconnected"}
                            </span>
                        </div>
                    </div>
                    
                    {channelNames.length === 0 ? (
                        <p className="text-slate-500 text-sm">No channels available</p>
                    ) : (
                        <ScrollArea className="max-h-40">
                            <div className="space-y-2">
                                {channelNames.map(channelName => {
                                    const channel = channels[channelName]
                                    const hasPublish = !!channel.publish
                                    const hasSubscribe = !!channel.subscribe
                                    
                                    return (
                                        <div
                                            key={channelName}
                                            className={cn(
                                                "p-3 rounded-lg border cursor-pointer transition-colors",
                                                selectedChannel === channelName
                                                    ? "bg-blue-50 border-blue-200 text-blue-900"
                                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                            )}
                                            onClick={() => handleChannelClick(channelName)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{channelName}</span>
                                                <div className="flex gap-1">
                                                    {hasPublish && (
                                                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                                            PUB
                                                        </Badge>
                                                    )}
                                                    {hasSubscribe && (
                                                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                                            SUB
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {channel.description && (
                                                <p className="text-xs text-slate-600 truncate">
                                                    {channel.description}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div> */}

                {/* Selected Channel Details */}
                <div className="flex-1 overflow-y-auto">
                    {selectedChannel && selectedChannelData ? (
                        <div className="p-4">
                            <div className="mb-4">
                                {/* header */}

                                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                                    {selectedChannel}
                                    <span className="text-sm text-slate-500 ml-2">
                                        {canPublish ? " (Publisher)" : ""} {canSubscribe ? " (Subscriber)" : ""}
                                    </span>
                                </h2>
                                {selectedChannelData.description && (
                                    <p className="text-sm text-slate-600">
                                        {selectedChannelData.description}
                                    </p>
                                )}

                            </div>

                            {/* Tab Navigation */}
                            <div className="flex border-b border-slate-200 mb-4">
                                <button
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                        activeTab === 'channels'
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700"
                                    )}
                                    onClick={() => setActiveTab('channels')}
                                >
                                    Channel Schema
                                </button>
                                <button
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                        activeTab === 'messages'
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-700"
                                    )}
                                    onClick={() => setActiveTab('messages')}
                                >
                                    Message Schema
                                </button>
                            </div>

                            {activeTab === 'channels' && (
                                <div className="space-y-6">
                                    {/* Publish Operation */}
                                    {canPublish && (
                                        <div className="bg-green-50 rounded-lg border border-green-200">
                                            <div className="p-3 border-b border-green-200">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-green-600 text-white">PUBLISH</Badge>
                                                    <h4 className="font-semibold text-slate-900">Send Message</h4>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                {selectedChannelData.publish.summary && (
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        {selectedChannelData.publish.summary}
                                                    </p>
                                                )}
                                                {selectedChannelData.publish.message?.payload && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-slate-700 mb-2">Payload Schema</h5>
                                                        <JsonSchemaViewer schema={selectedChannelData.publish.message.payload} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subscribe Operation */}
                                    {canSubscribe && (
                                        <div className="bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="p-3 border-b border-blue-200">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-600 text-white">SUBSCRIBE</Badge>
                                                    <h4 className="font-semibold text-slate-900">Receive Message</h4>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                {selectedChannelData.subscribe.summary && (
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        {selectedChannelData.subscribe.summary}
                                                    </p>
                                                )}
                                                {selectedChannelData.subscribe.message?.payload && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-slate-700 mb-2">Payload Schema</h5>
                                                        <JsonSchemaViewer schema={selectedChannelData.subscribe.message.payload} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'messages' && (
                                <div className="space-y-4">
                                    {canPublish && (
                                        <div className="bg-slate-50 rounded-lg border">
                                            <div className="p-3 border-b border-slate-200">
                                                <h4 className="font-semibold text-slate-900">Publish Message Example</h4>
                                            </div>
                                            <div className="p-4">
                                                <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(
                                                        generateMessageExample(selectedChannelData.publish.message),
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {canSubscribe && (
                                        <div className="bg-slate-50 rounded-lg border">
                                            <div className="p-3 border-b border-slate-200">
                                                <h4 className="font-semibold text-slate-900">Subscribe Message Example</h4>
                                            </div>
                                            <div className="p-4">
                                                <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(
                                                        generateMessageExample(selectedChannelData.subscribe.message),
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Channel</h3>
                                <p className="text-slate-500 text-sm">
                                    Choose a channel from the list above to view its details and test socket operations
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Socket Testing */}
            <div className="flex-1 xl:w-1/2 flex flex-col bg-slate-50">
                <div className="border-b border-slate-200 p-4 bg-white">
                    <h3 className="font-semibold text-slate-900">Socket.IO Testing</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Connection Panel */}
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                            <h4 className="font-medium text-slate-900">Connection</h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Socket.IO Server URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ws://localhost:3000"
                                        value={socketUrl}
                                        onChange={(e) => setSocketUrl(e.target.value)}
                                    />
                                    <Button
                                        onClick={socketConnected ? disconnectSocket : connectSocket}
                                        variant={socketConnected ? "destructive" : "default"}
                                        size="sm"
                                        className="px-4"
                                    >
                                        {socketConnected ? (
                                            <>
                                                <WifiOff className="w-4 h-4 mr-2" />
                                                Disconnect
                                            </>
                                        ) : (
                                            <>
                                                <Wifi className="w-4 h-4 mr-2" />
                                                Connect
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className={cn(
                                "p-3 rounded-lg text-sm",
                                socketConnected
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : "bg-red-50 border border-red-200 text-red-800"
                            )}>
                                {socketConnected
                                    ? "✅ Connected to Socket.IO server"
                                    : "❌ Not connected to Socket.IO server"
                                }
                            </div>
                        </div>
                    </div>

                    {/* Channel Testing */}
                    {selectedChannel && selectedChannelData && (
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                                <h4 className="font-medium text-slate-900">Test Channel: {selectedChannel}</h4>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Publish Testing */}
                                {canPublish && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-600 text-white">PUBLISH</Badge>
                                            <span className="text-sm font-medium">Send Message</span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Message Payload
                                            </label>
                                            <Textarea
                                                value={socketPayload}
                                                onChange={(e) => setSocketPayload(e.target.value)}
                                                className="font-mono text-sm"
                                                rows={6}
                                                placeholder={JSON.stringify(
                                                    generateMessageExample(selectedChannelData.publish.message),
                                                    null,
                                                    2
                                                )}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => emitSocketEvent(selectedChannel)}
                                            disabled={!socketConnected}
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Message
                                        </Button>
                                    </div>
                                )}

                                {/* Subscribe Testing */}
                                {canSubscribe && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-600 text-white">SUBSCRIBE</Badge>
                                            <span className="text-sm font-medium">Listen for Messages</span>
                                        </div>
                                        <Button
                                            onClick={() => toggleEventListener(selectedChannel)}
                                            disabled={!socketConnected}
                                            variant={listeningEvents.has(selectedChannel) ? "default" : "outline"}
                                            className="w-full"
                                        >
                                            {listeningEvents.has(selectedChannel) ? (
                                                <>
                                                    <Pause className="w-4 h-4 mr-2" />
                                                    Stop Listening
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Start Listening
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {!socketConnected && (
                                    <div className="text-sm text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded">
                                        ⚠️ Connect to a Socket.IO server first to test channels
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages Log */}
                    {socketMessages.length > 0 && (
                        <div className="bg-white rounded-lg border shadow-sm">
                            <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg flex items-center justify-between">
                                <h4 className="font-medium text-slate-900">Messages ({socketMessages.length})</h4>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSocketMessages([])}
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="p-4">
                                <ScrollArea className="h-96">
                                    <div className="space-y-3">
                                        {socketMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "p-3 rounded-lg border text-sm",
                                                    message.type === "sent"
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-blue-50 border-blue-200"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={message.type === "sent" ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {message.type === "sent" ? "SENT" : "RECEIVED"}
                                                        </Badge>
                                                        <span className="font-mono text-xs">{message.event}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {message.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                                    {JSON.stringify(message.data, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {!selectedChannel && (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border">
                                    <Zap className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Ready to Test</h3>
                                <p className="text-slate-500 text-sm">
                                    Select a channel to start testing Socket.IO events
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
