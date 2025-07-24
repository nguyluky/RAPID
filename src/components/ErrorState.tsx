import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  loadingError: string
  swaggerUrl?: string
  asyncApiUrl?: string
}

export default function ErrorState({ loadingError, swaggerUrl, asyncApiUrl }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Failed to Load API Specifications</h2>
        <p className="text-slate-600 mb-6">{loadingError}</p>
        <div className="space-y-2 text-sm text-slate-500 mb-6">
          {swaggerUrl && <p>Swagger URL: {swaggerUrl}</p>}
          {asyncApiUrl && <p>AsyncAPI URL: {asyncApiUrl}</p>}
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </Button>
      </div>
    </div>
  )
}
