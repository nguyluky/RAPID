"use client"

import { useEffect, useState } from "react"

// Utility functions for URL hash management
const encodeEndpointForHash = (endpoint: string): string => {
  // Convert endpoint to readable format
  // e.g., "/api/users/{id}-get" becomes "api-users-id-get"
  return "api-" + endpoint
    .replace(/^\//, '') // Remove leading slash
    .replace(/\//g, '-') // Replace slashes with dashes
    .replace(/\{([^}]+)\}/g, '$1') // Remove curly braces from path params
    .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace special chars with dashes
    .replace(/-+/g, '-') // Remove duplicate dashes
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase()
}

const decodeEndpointFromHash = (hash: string, apiSpec: any): string => {
  if (!apiSpec.paths) return "/api/users-get"
  
  // Remove 'api-' prefix if present
  const cleanHash = hash.startsWith('api-') ? hash.slice(4) : hash
  
  // First, try to find exact match
  for (const [path, methods] of Object.entries(apiSpec.paths)) {
    for (const method of Object.keys(methods as any)) {
      const fullEndpoint = `${path}-${method}`
      const encodedEndpoint = encodeEndpointForHash(fullEndpoint).slice(4) // Remove 'api-' prefix for comparison
      if (encodedEndpoint === cleanHash) {
        return fullEndpoint
      }
    }
  }
  
  // If no exact match, try partial matching
  for (const [path, methods] of Object.entries(apiSpec.paths)) {
    for (const method of Object.keys(methods as any)) {
      const fullEndpoint = `${path}-${method}`
      if (fullEndpoint.includes(cleanHash) || cleanHash.includes(path.replace(/\//g, '-'))) {
        return fullEndpoint
      }
    }
  }
  
  // If still no match, return the first available endpoint
  const firstPath = Object.keys(apiSpec.paths)[0]
  if (firstPath) {
    const firstMethod = Object.keys(apiSpec.paths[firstPath])[0]
    return `${firstPath}-${firstMethod}`
  }
  
  return "/api/users-get" // ultimate fallback
}

// New hash management functions for all page types
const parseHashRoute = (hash: string): { section: string; item?: string } => {
  if (!hash) return { section: "overview" }
  
  if (hash === "overview") {
    return { section: "overview" }
  }
  
  if (hash.startsWith("api-")) {
    return { section: "rest", item: hash }
  }
  
  if (hash.startsWith("schema-")) {
    return { section: "rest", item: hash }
  }
  
  if (hash.startsWith("socket-")) {
    return { section: "socket", item: hash }
  }
  
  // Default fallback
  return { section: "overview" }
}

const encodeSchemaForHash = (schemaName: string): string => {
  return "schema-" + schemaName
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const encodeSocketEventForHash = (eventName: string): string => {
  return "socket-" + eventName
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const decodeSchemaFromHash = (hash: string, apiSpec: any): string | null => {
  if (!hash.startsWith("schema-")) return null
  
  const schemaName = hash.slice(7) // Remove 'schema-' prefix
  const schemas = apiSpec?.components?.schemas || apiSpec?.definitions || {}
  
  // Try exact match first
  for (const [name] of Object.entries(schemas)) {
    if (name.toLowerCase().replace(/[^a-zA-Z0-9\-_]/g, '-') === schemaName) {
      return name
    }
  }
  
  // Try partial match
  for (const [name] of Object.entries(schemas)) {
    if (name.toLowerCase().includes(schemaName) || schemaName.includes(name.toLowerCase())) {
      return name
    }
  }
  
  return null
}

const decodeSocketEventFromHash = (hash: string, asyncApiSpec: any): string | null => {
  if (!hash.startsWith("socket-")) return null
  
  const eventName = hash.slice(7) // Remove 'socket-' prefix
  const channels = asyncApiSpec?.channels || {}
  
  // Try exact match first
  for (const channelName of Object.keys(channels)) {
    if (channelName.toLowerCase().replace(/[^a-zA-Z0-9\-_]/g, '-') === eventName) {
      return channelName
    }
  }
  
  // Try partial match
  for (const channelName of Object.keys(channels)) {
    if (channelName.toLowerCase().includes(eventName) || eventName.includes(channelName.toLowerCase())) {
      return channelName
    }
  }
  
  return null
}

const setHashRoute = (section: string, item?: string) => {
  if (typeof window === 'undefined') return
  
  let hash = ""
  
  switch (section) {
    case "overview":
      hash = "overview"
      break
    case "rest":
      if (item) {
        if (item.startsWith("schema-")) {
          hash = item
        } else if (item.startsWith("api-")) {
          hash = item
        } else {
          // It's an endpoint, encode it
          hash = encodeEndpointForHash(item)
        }
      } else {
        hash = "overview"
      }
      break
    case "socket":
      if (item) {
        hash = item.startsWith("socket-") ? item : encodeSocketEventForHash(item)
      } else {
        hash = "socket-overview"
      }
      break
    default:
      hash = "overview"
  }
  
  window.location.hash = hash
}

const getInitialStateFromHash = (apiSpec: any = null, asyncApiSpec: any = null) => {
  if (typeof window === 'undefined') {
    return {
      activeSection: "overview",
      selectedEndpoint: "/api/users-get",
      selectedSchema: null,
      selectedSocketEvent: null
    }
  }
  
  const hash = window.location.hash.slice(1)
  const route = parseHashRoute(hash)
  
  let selectedEndpoint = "/api/users-get"
  let selectedSchema = null
  let selectedSocketEvent = null
  
  if (route.section === "rest" && route.item) {
    if (route.item.startsWith("api-") && apiSpec) {
      selectedEndpoint = decodeEndpointFromHash(route.item, apiSpec)
    } else if (route.item.startsWith("schema-") && apiSpec) {
      selectedSchema = decodeSchemaFromHash(route.item, apiSpec)
    }
  } else if (route.section === "socket" && route.item && asyncApiSpec) {
    selectedSocketEvent = decodeSocketEventFromHash(route.item, asyncApiSpec)
  }
  
  return {
    activeSection: route.section,
    selectedEndpoint,
    selectedSchema,
    selectedSocketEvent
  }
}

interface SocketMessage {
  id: string
  type: "sent" | "received"
  event: string
  data: any
  timestamp: Date
}

export function useSwaggerApi(swaggerUrl: string, asyncApiUrl: string) {
  // API specifications
  const [apiSpec, setApiSpec] = useState<any>({})
  const [asyncApiSpec, setAsyncApiSpec] = useState<any>({})

  // Loading and error states
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // UI state - Initialize from hash
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Initialize state from hash
  const urlHashPath = useState(() => window.location.hash.slice(1))    
  
  // Socket state
  const [socketConnected, setSocketConnected] = useState(false)
  
  // Modal and UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [authToken, setAuthToken] = useState("")


  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Load API specs on component mount
  useEffect(() => {
    const loadApiSpecs = async () => {
      setIsInitialLoading(true)
      setLoadingError(null)

      try {
        const promises = []
        
        // Load Swagger/OpenAPI if URL provided
        if (swaggerUrl) {
          promises.push(loadSwaggerSpec(swaggerUrl))
        }
        
        // Load AsyncAPI if URL provided
        if (asyncApiUrl) {
          promises.push(loadAsyncApiSpec(asyncApiUrl))
        }

        if (promises.length === 0) {
          setLoadingError("No API URLs provided")
          setIsInitialLoading(false)
          return
        }

        await Promise.allSettled(promises)
        
        // // Check if at least one spec was loaded successfully
        // if (!swaggerLoaded && !asyncApiLoaded) {
        //     console.log("No API specifications loaded")
        //   setLoadingError("Failed to load any API specifications")
        // }
      } catch (error) {
        setLoadingError("Failed to load API specifications: " + (error as any).message)
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadApiSpecs()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSearchModal) {
        setShowSearchModal(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showSearchModal])

  const loadSwaggerSpec = async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load Swagger spec: ${response.status}`)
      }
      
      const text = await response.text()
      let parsed
      
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        throw new Error("Invalid JSON format in Swagger spec")
      }
      
      if (parsed.openapi || parsed.swagger) {
        setApiSpec(parsed)
      } else {
        throw new Error("Invalid OpenAPI/Swagger format")
      }
    } catch (error) {
      console.error("Error loading Swagger spec:", error)
      throw error
    }
  }

  const loadAsyncApiSpec = async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load AsyncAPI spec: ${response.status}`)
      }
      
      const text = await response.text()
      let parsed
      
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        throw new Error("Invalid JSON format in AsyncAPI spec")
      }
      
      if (parsed.asyncapi) {
        setAsyncApiSpec(parsed)
      } else {
        throw new Error("Invalid AsyncAPI format")
      }
    } catch (error) {
      console.error("Error loading AsyncAPI spec:", error)
      throw error
    }
  }

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results: any[] = []
    const searchLower = query.toLowerCase()

    // Search REST endpoints
    if (apiSpec.paths) {
      Object.entries(apiSpec.paths).forEach(([path, methods]) => {
        Object.entries(methods as any).forEach(([method, details]: [string, any]) => {
          if (
            path.toLowerCase().includes(searchLower) ||
            details.summary?.toLowerCase().includes(searchLower) ||
            details.description?.toLowerCase().includes(searchLower) ||
            method.toLowerCase().includes(searchLower)
          ) {
            results.push({
              type: "rest",
              id: `${path}-${method}`,
              title: details.summary,
              subtitle: `${method.toUpperCase()} ${path}`,
              description: details.description,
              method: method.toUpperCase(),
            })
          }
        })
      })
    }

    // Search Socket.IO channels
    if (asyncApiSpec.channels) {
      Object.entries(asyncApiSpec.channels).forEach(([channel, details]: [string, any]) => {
        if (channel.toLowerCase().includes(searchLower) || details.description?.toLowerCase().includes(searchLower)) {
          if (details.publish) {
            results.push({
              type: "socket",
              id: `${channel}-publish`,
              title: details.publish.summary,
              subtitle: `PUBLISH ${channel}`,
              description: details.description,
              method: "PUBLISH",
            })
          }
          if (details.subscribe) {
            results.push({
              type: "socket",
              id: `${channel}-subscribe`,
              title: details.subscribe.summary,
              subtitle: `SUBSCRIBE ${channel}`,
              description: details.description,
              method: "SUBSCRIBE",
            })
          }
        }
      })
    }

    setSearchResults(results)
  }

  const groupEndpointsByTags = (paths: any) => {
    if (!paths) return {}

    const grouped: { [tag: string]: any } = {}
    const untaggedEndpoints: any = {}

    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods as any).forEach(([method, details]: [string, any]) => {
        const tags = details.tags || ['Untagged']
        
        tags.forEach((tag: string) => {
          if (tag === 'Untagged') {
            if (!untaggedEndpoints[path]) {
              untaggedEndpoints[path] = {}
            }
            untaggedEndpoints[path][method] = details
          } else {
            if (!grouped[tag]) {
              grouped[tag] = {}
            }
            if (!grouped[tag][path]) {
              grouped[tag][path] = {}
            }
            grouped[tag][path][method] = details
          }
        })
      })
    })

    // Add untagged endpoints if any exist
    if (Object.keys(untaggedEndpoints).length > 0) {
      grouped['Untagged'] = untaggedEndpoints
    }

    return grouped
  }

  // Handle URL hash changes and sync with state
  useEffect(() => {
    const handleHashChange = () => {
        // TODO: 
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [apiSpec, asyncApiSpec])


  // Custom setters that update both state and URL hash
  const setActiveSectionWithHash = (section: string) => {
    setActiveSection(section)
    if (section === "overview") {
      setHashRoute("overview")
    } else if (section === "rest") {
      // If switching to REST, maintain current endpoint or schema
      if (selectedSchema) {
        setHashRoute("rest", encodeSchemaForHash(selectedSchema))
      } else if (selectedEndpoint && selectedEndpoint !== "/api/users-get") {
        setHashRoute("rest", selectedEndpoint)
      } else {
        setHashRoute("rest")
      }
    } else if (section === "socket") {
      if (selectedSocketEvent) {
        setHashRoute("socket", selectedSocketEvent)
      } else {
        setHashRoute("socket")
      }
    }
  }

  const setSelectedEndpointWithHash = (endpoint: string) => {
    setSelectedEndpoint(endpoint)
    setSelectedSchema(null) // Clear schema when selecting endpoint
    setHashRoute("rest", endpoint)
    if (activeSection !== "rest") {
      setActiveSection("rest")
    }
  }

  const setSelectedSchemaWithHash = (schema: string | null) => {
    setSelectedSchema(schema)
    if (schema) {
      setSelectedEndpoint("") // Clear endpoint when selecting schema
      setHashRoute("rest", encodeSchemaForHash(schema))
      if (activeSection !== "rest") {
        setActiveSection("rest")
      }
    }
  }

  const setSelectedSocketEventWithHash = (event: string | null) => {
    setSelectedSocketEvent(event)
    if (event) {
      setHashRoute("socket", event)
      if (activeSection !== "socket") {
        setActiveSection("socket")
      }
    }
  }

  return {
    // API specs
    apiSpec,
    asyncApiSpec,
    isInitialLoading,
    loadingError,
    swaggerLoaded,
    asyncApiLoaded,

    // UI state
    sidebarCollapsed,
    setSidebarCollapsed,
    activeSection,
    setActiveSection: setActiveSectionWithHash,
    selectedEndpoint,
    setSelectedEndpoint: setSelectedEndpointWithHash,
    selectedSocketEvent,
    setSelectedSocketEvent: setSelectedSocketEventWithHash,
    selectedSchema,
    setSelectedSchema: setSelectedSchemaWithHash,

    // Socket state
    socketConnected,
    socketUrl,
    setSocketUrl,
    socketMessages,
    setSocketMessages,
    listeningEvents,
    connectSocket,
    disconnectSocket,

    // Request/Response
    requestBody,
    setRequestBody,
    socketPayload,
    setSocketPayload,
    responses,
    setResponses,

    // Search and filters
    expandedSections,
    searchQuery,
    setSearchQuery,
    searchResults,
    performSearch,
    groupEndpointsByTags,

    // Auth
    authToken,
    setAuthToken,
    authScheme,
    setAuthScheme,
    showAuthModal,
    setShowAuthModal,

    // Search modal
    showSearchModal,
    setShowSearchModal,

    // Actions
    emitSocketEvent,
    toggleSection,
    toggleEventListener,
  }
}
