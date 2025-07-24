interface LoadingStateProps {
  swaggerUrl?: string
  asyncApiUrl?: string
}

export default function LoadingState({ swaggerUrl, asyncApiUrl }: LoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading API Specifications...</h2>
        <p className="text-slate-600">
          {swaggerUrl && asyncApiUrl 
            ? "Loading both Swagger and AsyncAPI specifications"
            : swaggerUrl 
            ? "Loading Swagger/OpenAPI specification" 
            : "Loading AsyncAPI specification"
          }
        </p>
      </div>
    </div>
  )
}
