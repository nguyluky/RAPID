import { Badge } from "@/components/ui/badge";
import {
    cn,
    getMethodColor,
    getPathParameters,
    getQueryParameters,
    getRequestBodySchema,
    getSecuritySchemes,
    requiresAuth,
} from "@/lib/utils";
import JsonSchemaViewer from "./jsonSchemaView";
import TryItPanel from "./TryItPanel";

interface RestSectionProps {
    apiSpec: any;
    authToken: string;
}

export default function RestSection({ apiSpec, authToken }: RestSectionProps) {
    const [path, method] = window.location.hash
        .replace("#REST-", "")
        .replaceAll("-", "/")
        .split("_");
    const endpoint = (apiSpec.paths as any)[path]?.[method];

    return (
        <div className="h-full flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden">
            {/* Documentation Panel */}
            {/* where mobile/tabel disable overflow */}
            <div className="flex-1 xl:w-1/2 xl:border-r border-slate-200 overflow-y-disable xl:overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <div
                                className={cn(
                                    "text-xs sm:text-sm px-2 sm:px-3 py-1 rounded font-medium border",
                                    getMethodColor(method)
                                )}
                            >
                                {method?.toUpperCase()}
                            </div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
                                {endpoint?.summary || `${method.toUpperCase()} ${path}`}
                            </h1>
                        </div>
                        <p className="text-sm sm:text-base text-slate-600 mb-4">
                            {endpoint?.description || "No description available"}
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg overflow-x-auto">
                            <code className="text-xs sm:text-sm font-mono whitespace-nowrap">
                                {method?.toUpperCase()} {path}
                            </code>
                        </div>
                    </div>

                    {/* Authentication */}
                    {requiresAuth(endpoint, apiSpec) && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Authentication</h3>
                            <div className="space-y-3">
                                {Object.entries(getSecuritySchemes(apiSpec)).map(
                                    ([schemeName, schemeData]: [string, any]) => {
                                        const isBearer =
                                            schemeData.type === "http" &&
                                            schemeData.scheme === "bearer";
                                        const isApiKey = schemeData.type === "apiKey";

                                        return (
                                            <div
                                                key={schemeName}
                                                className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="default" className="bg-blue-400">
                                                        {isBearer
                                                            ? "Bearer Token"
                                                            : isApiKey
                                                                ? "API Key"
                                                                : schemeData.type}
                                                    </Badge>
                                                    <span className="text-sm font-medium">
                                                        {schemeData.description ||
                                                            (isBearer
                                                                ? "JWT Authentication"
                                                                : isApiKey
                                                                    ? "API Key Authentication"
                                                                    : "Authentication")}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">
                                                    {schemeData.description ||
                                                        (isBearer
                                                            ? "This endpoint requires a valid JWT token in the Authorization header"
                                                            : isApiKey
                                                                ? `This endpoint requires an API key in the ${schemeData.in} named "${schemeData.name}"`
                                                                : "This endpoint requires authentication")}
                                                </p>
                                                <div className="bg-white p-2 rounded border font-mono text-xs">
                                                    {isBearer
                                                        ? `Authorization: Bearer ${authToken || "{your-jwt-token}"
                                                        }`
                                                        : isApiKey
                                                            ? `${schemeData.name}: ${authToken || "{your-api-key}"
                                                            }`
                                                            : "Authentication required"}
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}

                    {/* Path Parameters */}
                    {getPathParameters(endpoint).length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Path Parameters</h3>
                            <div className="space-y-3">
                                <JsonSchemaViewer
                                    schema={{
                                        type: "object",
                                        properties: Object.fromEntries(
                                            getPathParameters(endpoint).map((param: any) => {
                                                return [param.name, param.schema];
                                            })
                                        ),
                                        required: getPathParameters(endpoint)
                                            .filter((param: any) => param.required)
                                            .map((param: any) => param.name),
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Query Parameters */}
                    {getQueryParameters(endpoint).length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Query Parameters</h3>
                            <div className="space-y-3">
                                <JsonSchemaViewer
                                    schema={{
                                        type: "object",
                                        properties: Object.fromEntries(
                                            getQueryParameters(endpoint).map((param: any) => {
                                                return [param.name, param.schema];
                                            })
                                        ),
                                        required: getQueryParameters(endpoint)
                                            .filter((param: any) => param.required)
                                            .map((param: any) => param.name),
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Request Body */}
                    {getRequestBodySchema(endpoint) && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Request Body</h3>
                            <div className="space-y-3">
                                {(() => {
                                    const requestBodySchema = getRequestBodySchema(endpoint);
                                    if (!requestBodySchema) {
                                        return (
                                            <div className="text-sm text-slate-500 italic">
                                                No request body schema defined
                                            </div>
                                        );
                                    }
                                    return <JsonSchemaViewer schema={requestBodySchema} />;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Responses */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Responses</h3>
                        <div className="space-y-3">
                            {Object.entries(endpoint.responses || {}).map(
                                ([statusCode, response]: [string, any]) => {
                                    const colorClasses = {
                                        "2": { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-400" },
                                        "4": { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-400" },
                                        "5": { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-400" },
                                        default: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-400" },
                                    };
                                    const colorKey = statusCode.charAt(0);
                                    const color = (colorClasses as any)[colorKey] || colorClasses.default;

                                    return (
                                        <div
                                            key={statusCode}
                                            className={cn("border p-4 rounded-lg", color.bg, color.border)}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="default" className={color.badge}>
                                                    {statusCode}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {response.description || "No description"}
                                                </span>
                                            </div>
                                            {response.content && response.content["application/json"] && (
                                                <JsonSchemaViewer
                                                    schema={response.content["application/json"].schema}
                                                />
                                            )}
                                        </div>
                                    )
                                }
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Try It Panel */}
            <div className="flex-1 xl:w-1/2 xl:border-r bg-slate-900 text-white overflow-y-disable xl:overflow-y-auto">

                <TryItPanel
                    apiSpec={apiSpec}
                    path={path} method={method}
                    servers={apiSpec.servers || []}
                    endpoint={endpoint}
                    authToken={authToken}
                />
            </div>

        </div>
    );
}
