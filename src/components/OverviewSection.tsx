import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    FileText,
    Globe,
    Settings,
    User,
    Zap,
} from "lucide-react"

interface OverviewSectionProps {
  apiSpec: any
  asyncApiSpec: any
}

export default function OverviewSection({ apiSpec, asyncApiSpec }: OverviewSectionProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">{apiSpec.info?.title}</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">{apiSpec.info?.description}</p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Version {apiSpec.info?.version}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            OpenAPI 3.0.0
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            AsyncAPI 2.6.0
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <Globe className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-slate-900">{Object.keys(apiSpec.paths || {}).length}</h3>
          <p className="text-slate-600">REST Endpoints</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <Zap className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-slate-900">{Object.keys(asyncApiSpec.channels || {}).length}</h3>
          <p className="text-slate-600">Socket.IO Channels</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
          <Settings className="w-8 h-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-slate-900">{(apiSpec.servers || []).length}</h3>
          <p className="text-slate-600">Available Servers</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Authentication</h3>
              <p className="text-slate-600 text-sm">
                Set up your API credentials using Bearer tokens or API keys.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Explore Endpoints</h3>
              <p className="text-slate-600 text-sm">
                Browse through REST API endpoints and test them directly in the interface.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Real-time Events</h3>
              <p className="text-slate-600 text-sm">
                Connect to Socket.IO channels for real-time communication and event handling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Servers */}
      {apiSpec.servers && apiSpec.servers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Servers</h2>
          <div className="space-y-3">
            {apiSpec.servers.map((server: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-mono text-sm text-slate-900">{server.url}</div>
                  <div className="text-xs text-slate-600">{server.description}</div>
                </div>
                <Badge variant={server.description?.includes("Production") ? "default" : "secondary"}>
                  {server.description?.includes("Production") ? "Production" : "Development"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authentication Methods */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">Bearer Token</Badge>
              <span className="text-sm font-medium">JWT Authentication</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Use JWT tokens for secure API access. Include in the Authorization header.
            </p>
            <div className="bg-slate-50 p-2 rounded font-mono text-xs">
              Authorization: Bearer {"{your-jwt-token}"}
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">API Key</Badge>
              <span className="text-sm font-medium">Header Authentication</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Use API keys for simple authentication. Include in the X-API-Key header.
            </p>
            <div className="bg-slate-50 p-2 rounded font-mono text-xs">X-API-Key: {"{your-api-key}"}</div>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900 mb-1">Documentation</h3>
            <p className="text-sm text-slate-600">Comprehensive API guides and examples</p>
          </div>
          <div className="text-center">
            <User className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900 mb-1">Support</h3>
            <p className="text-sm text-slate-600">Get help from our support team</p>
          </div>
          <div className="text-center">
            <Settings className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900 mb-1">API Status</h3>
            <p className="text-sm text-slate-600">Check real-time API status</p>
          </div>
        </div>
      </div>
    </div>
  )
}
