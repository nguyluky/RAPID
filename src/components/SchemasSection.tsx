"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import useHashUrlPath from "@/hooks/useHashUrlPath"
import { cn } from "@/lib/utils"
import JsonSchemaViewer from "./jsonSchemaView"

interface SchemasSectionProps {
    apiSpec: any
}

export default function SchemasSection({
    apiSpec,
}: SchemasSectionProps) {
    const { hashPath, updateHashPath } = useHashUrlPath()

    const schemas = apiSpec?.components?.schemas || {}
    const schemaNames = Object.keys(schemas)
    const schemaName = hashPath.startsWith('#SCHEMAS') ? hashPath.replace('#SCHEMAS-', '') : ''
    const selectedSchema = schemaName;

    const handleSchemaClick = (schemaName: string) => {
        const newPath = selectedSchema === schemaName ? '#SCHEMAS' : `#SCHEMAS${schemaName}`
        updateHashPath(newPath)
    }

    const generateExample = (schema: any): any => {
        if (!schema) return null

        switch (schema.type) {
            case 'object':
                const example: any = {}
                if (schema.properties) {
                    Object.keys(schema.properties).forEach(key => {
                        example[key] = generateExample(schema.properties[key])
                    })
                }
                return example
            case 'array':
                return schema.items ? [generateExample(schema.items)] : []
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

    return (
        <div className="h-full flex flex-col xl:flex-row overflow-hidden">
            {/* Left Panel - Schema List & Selected Schema Details */}
            <div className="flex-1 xl:w-1/2 xl:border-r border-slate-200 flex flex-col">
                {/* Schema List */}
                <div className="border-b border-slate-200 p-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 ">
                        {schemaName}
                    </h3>
                    <span className="text-xs text-slate-500">
                        {schemas[schemaName]?.type || 'object'}
                    </span>
                </div>

                {/* Selected Schema Details */}
                <div className="flex-1 overflow-y-auto">
                    {selectedSchema && schemas[selectedSchema] ? (
                        <div className="p-4">

                            <JsonSchemaViewer
                                schema={schemas[selectedSchema]}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Schema</h3>
                                <p className="text-slate-500 text-sm">
                                    Choose a schema from the list above to view its structure and example
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Example View */}
            <div className="flex-1 xl:w-1/2 flex flex-col bg-slate-50">
                <div className="border-b border-slate-200 p-4 bg-white">
                    <h3 className="font-semibold text-slate-900">Example</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {selectedSchema && schemas[selectedSchema] ? (
                        <div className="bg-white rounded-lg border shadow-sm border-slate-200">
                            <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                                <h4 className="font-medium text-slate-900">JSON Example</h4>
                            </div>
                            <div className="p-4">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(generateExample(schemas[selectedSchema]), null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No Example Available</h3>
                                <p className="text-slate-500 text-sm">
                                    Select a schema to see its JSON example
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
