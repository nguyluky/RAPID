"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Send, Trash2, Zap } from "lucide-react"

interface SocketMessage {
  id: string
  type: "sent" | "received"
  event: string
  data: any
  timestamp: Date
}

interface SocketSectionProps {
  selectedSocketEvent: string | null
  asyncApiSpec: any
  socketConnected: boolean
  socketPayload: string
  setSocketPayload: (payload: string) => void
  emitSocketEvent: (event: string) => void
  listeningEvents: Set<string>
  toggleEventListener: (event: string) => void
  socketMessages: SocketMessage[]
  setSocketMessages: (messages: SocketMessage[]) => void
}

export default function SocketSection({
  selectedSocketEvent,
  asyncApiSpec,
  socketConnected,
  socketPayload,
  setSocketPayload,
  emitSocketEvent,
  listeningEvents,
  toggleEventListener,
  socketMessages,
  setSocketMessages,
}: SocketSectionProps) {
  if (!selectedSocketEvent) {
    return (
      <div className="h-full flex flex-col lg:flex-row">
        <div className="flex-1 lg:w-1/2 border-r border-slate-200 overflow-y-auto">
          <div className="p-6 flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Select a Socket.IO event to view documentation</p>
            </div>
          </div>
        </div>
        <div className="flex-1 lg:w-1/2 bg-slate-900 text-white overflow-y-auto dark-scrollbar">
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold mb-4">Socket.IO Testing</h2>
            <p className="text-slate-400">Select an event from the sidebar to start testing</p>
          </div>
        </div>
      </div>
    )
  }

  const [channel, action] = selectedSocketEvent.split("-")
  const channelDetails = (asyncApiSpec.channels as any)[channel]
  const eventDetails = channelDetails?.[action]

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Socket Events Documentation */}
      <div className="flex-1 lg:w-1/2 border-r border-slate-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={action === "publish" ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {action?.toUpperCase()}
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900">{channel}</h1>
            </div>
            <p className="text-slate-600 mb-4">{eventDetails?.summary}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Channel Description</h3>
            <p className="text-slate-600">{channelDetails?.description || "No description available"}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Payload Schema</h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(eventDetails?.message?.payload || {}, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Example</h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                {selectedSocketEvent === "user/join-publish" &&
                  `{\n  "userId": "user123",\n  "room": "general"\n}`}
                {selectedSocketEvent === "message/send-publish" &&
                  `{\n  "text": "Hello everyone!",\n  "room": "general",\n  "userId": "user123"\n}`}
                {selectedSocketEvent === "user/join-subscribe" &&
                  `{\n  "userId": "user123",\n  "room": "general",\n  "timestamp": "2024-01-15T10:30:00Z",\n  "status": "joined"\n}`}
                {selectedSocketEvent === "message/received-subscribe" &&
                  `{\n  "id": "msg456",\n  "text": "Hello everyone!",\n  "userId": "user123",\n  "room": "general",\n  "timestamp": "2024-01-15T10:30:00Z"\n}`}
              </pre>
            </div>
          </div>

          {/* Operation Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Operation Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="text-sm font-medium">Channel</span>
                <code className="text-sm bg-white px-2 py-1 rounded">{channel}</code>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="text-sm font-medium">Operation</span>
                <Badge variant={action === "publish" ? "default" : "secondary"}>
                  {action?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="text-sm font-medium">Protocol</span>
                <span className="text-sm">Socket.IO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Socket Testing Panel */}
      <div className="flex-1 lg:w-1/2 bg-slate-900 text-white overflow-y-auto dark-scrollbar">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Socket.IO Testing</h2>

            {selectedSocketEvent &&
              channelDetails?.publish &&
              action === "publish" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Payload</label>
                    <Textarea
                      value={socketPayload}
                      onChange={(e) => setSocketPayload(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={() => emitSocketEvent(channel)}
                    disabled={!socketConnected}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Emit Event
                  </Button>

                  {!socketConnected && (
                    <div className="text-xs text-amber-300 p-3 bg-amber-900/20 rounded">
                      ⚠️ Connect to a Socket.IO server first to emit events
                    </div>
                  )}
                </div>
              )}

            {selectedSocketEvent &&
              channelDetails?.subscribe &&
              action === "subscribe" && (
                <div className="space-y-4">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Event Listener</h4>
                    <p className="text-sm text-slate-300 mb-3">
                      Listen for incoming messages on this channel
                    </p>
                  </div>

                  <Button
                    onClick={() => toggleEventListener(channel)}
                    disabled={!socketConnected}
                    variant={listeningEvents.has(channel) ? "default" : "outline"}
                    className="w-full"
                  >
                    {listeningEvents.has(channel) ? "Stop Listening" : "Start Listening"}
                  </Button>

                  {!socketConnected && (
                    <div className="text-xs text-amber-300 p-3 bg-amber-900/20 rounded">
                      ⚠️ Connect to a Socket.IO server first to listen for events
                    </div>
                  )}
                </div>
              )}
          </div>

          {socketMessages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Messages</h3>
                <Button variant="outline" size="sm" onClick={() => setSocketMessages([])}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {socketMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        message.type === "sent"
                          ? "bg-blue-900/50 border-blue-700"
                          : "bg-green-900/50 border-green-700",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.type === "sent" ? "default" : "secondary"}>
                            {message.type === "sent" ? "SENT" : "RECEIVED"}
                          </Badge>
                          <span className="font-mono text-sm">{message.event}</span>
                        </div>
                        <span className="text-xs text-slate-400">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <pre className="text-xs bg-slate-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {socketMessages.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              <Zap className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No messages yet. Start by emitting or listening to events.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
