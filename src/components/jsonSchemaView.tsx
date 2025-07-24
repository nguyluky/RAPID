import { cn } from "@/lib/utils";
import React from "react";

type JSONSchema = {
    type?: string;
    properties?: Record<string, JSONSchema>;
    items?: JSONSchema;
    description?: string;
    minimum?: number;
    maximum?: number;
    enum?: (string | number)[];
    required?: string[];
    oneOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    allOf?: JSONSchema[];
    $ref?: string;
};

type SchemaRowProps = {
    name: string;
    schema: JSONSchema;
    required?: boolean;
    level?: number;
};

const SchemaRow: React.FC<SchemaRowProps> = ({
    name,
    schema,
    required = false,
    level = 0,
}) => {
    const isObject = schema.type === "object" && schema.properties;
    const isArray = schema.type === "array" && schema.items;
    const nestedSchemas = schema.oneOf || schema.anyOf || schema.allOf;
    const hasChildren = isObject || isArray || nestedSchemas;

    const [expanded, setExpanded] = React.useState(false);

    return (
        <>
            <div data-level={level} className="text-xs">
                <div
                    data-test="schema-row"
                    className="flex relative max-w-full py-2 pl-3"
                >
                    <div className="w-3 mt-2 mr-3 -ml-3 border-t" />
                    <div className="flex flex-col space-y-1 flex-1 items-stretch max-w-full"
                        onClick={() => setExpanded((prev) => !prev)}
                    >
                        <div className="flex items-center max-w-full">
                            <div className="flex items-baseline text-sm">
                                <div className="font-mono mr-2">{name}</div>
                                <span className="truncate text-gray-500">
                                    {schema.type ?? (schema.$ref ? "$ref" : "unknown")}
                                </span>
                            </div>
                            {hasChildren && (
                                <div className="flex justify-center w-8 pl-3 text-gray-500">
                                    <svg
                                        className={cn("w-3 h-3 transition-transform duration-200",
                                            expanded ? "rotate-180" : "rotate-0",
                                        )}
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 448 512"
                                    >
                                        <path
                                            fill="currentColor"
                                            d="M224 416c-8.2 0-16.4-3.1-22.6-9.4l-192-192c-12.5-12.5-12.5-32.7 0-45.3s32.7-12.5 45.3 0L224 338.8l169.4-169.4c12.5-12.5 32.7-12.5 45.3 0s12.5 32.7 0 45.3l-192 192c-6.2 6.2-14.4 9.3-22.6 9.3z"
                                        />
                                    </svg>
                                </div>
                            )}
                            <div className="flex-1 h-px mx-3" />
                            {required && (
                                <span className="ml-2 text-yellow-600 font-medium">required</span>
                            )}
                        </div>

                        {schema.description && (
                            <div
                                style={{ fontSize: 12 }}
                                className="prose prose-sm max-w-none"
                            >
                                <p>{schema.description}</p>
                            </div>
                        )}

                        {(schema.minimum !== undefined || schema.maximum !== undefined) && (
                            <div className="flex flex-wrap items-center text-gray-500 space-x-2">
                                {schema.minimum !== undefined && (
                                    <span className="break-all px-1 bg-gray-100 rounded border text-xs">
                                        &gt;= {schema.minimum}
                                    </span>
                                )}
                                {schema.maximum !== undefined && (
                                    <span className="break-all px-1 bg-gray-100 rounded border text-xs">
                                        &lt;= {schema.maximum}
                                    </span>
                                )}
                            </div>
                        )}

                        {schema.enum && (
                            <div className="flex flex-wrap items-center text-gray-500 gap-2 mt-1">
                                {schema.enum.map((val, idx) => (
                                    <span
                                        key={idx}
                                        className="break-all px-1 bg-gray-100 text-gray-500 rounded border text-xs"
                                    >
                                        {String(val)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {schema.$ref && (
                            <div className="text-gray-500 text-xs">
                                Ref to: <code>{schema.$ref}</code>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toggle children */}
            <div className={cn(
                "overflow-hidden transition-all duration-200",
                expanded ? "max-h-screen" : "max-h-0",
                hasChildren ? "border-l border-gray-200" : ""
            )}>

                {/* Object children */}
                {isObject && (
                    <div data-level={level + 1} className="text-xs ml-7 border-l">
                        {Object.entries(schema.properties!).map(([key, childSchema]) => (
                            <SchemaRow
                                key={key}
                                name={key}
                                schema={childSchema}
                                required={schema.required?.includes(key)}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}

                {/* Array items */}
                {isArray && (
                    <div data-level={level + 1} className="text-xs ml-7 border-l">
                        <SchemaRow
                            name="items"
                            schema={schema.items!}
                            level={level + 1}
                        />
                    </div>
                )}

                {/* Compositions */}
                {nestedSchemas && (
                    <div data-level={level + 1} className="text-xs ml-7 border-l">
                        {nestedSchemas.map((subSchema, idx) => (
                            <SchemaRow
                                key={idx}
                                name={
                                    (schema.oneOf && "oneOf") ||
                                    (schema.anyOf && "anyOf") ||
                                    (schema.allOf && "allOf")!
                                }
                                schema={subSchema}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>


        </>
    );
};

type JsonSchemaViewerProps = {
    schema: JSONSchema;
};

const JsonSchemaViewer: React.FC<JsonSchemaViewerProps> = ({ schema }) => {
    if (schema.type !== "object" || !schema.properties) {
        return <SchemaRow
            name={"root"}
            schema={schema}
            required={false}
            level={0}
        />
    }

    return (
        <div data-level={0} className="text-xs ml-px border-l">
            {Object.entries(schema.properties).map(([key, value]) => (
                <SchemaRow
                    key={key}
                    name={key}
                    schema={value}
                    required={schema.required?.includes(key)}
                    level={0}
                />
            ))}
        </div>
    );
};

export default JsonSchemaViewer;
