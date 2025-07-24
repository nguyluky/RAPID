
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateExampleFromSchemaWithRefs, getPathParameters, getQueryParameters, getRequestBodySchema } from "@/lib/utils";
import { Check, Copy, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface TryItPanelProps {
    apiSpec: any;
    servers: { url: string, description?: string }[];
    endpoint: any;
    authToken: string;
    path: string;
    method: string;
}

function ParameterItem({ param, pathParams, setPathParams }: {
    param: any;
    pathParams: Record<string, string>;
    setPathParams: (params: Record<string, string>) => void;
}) {
    const import_type = param.schema?.import_type || "string";
    // convert schema to input type
    let inputType = "text";
    if (import_type === "integer") {
        inputType = "number";
    } else if (import_type === "boolean") {
        inputType = "checkbox";
    } else if (import_type === "array") {
        // TODO: Handle array input types properly
        inputType = "text"; // For simplicity, treat arrays as text inputs
    } else if (import_type === "object") {
        // TODO: Handle object input types properly
        inputType = "text"; // For simplicity, treat objects as text inputs
    }

    // format
    const format = param.schema?.format || "";
    if (format === "date-time") {
        inputType = "datetime-local";
    } else if (format === "date") {
        inputType = "date";
    } else if (format === "email") {
        inputType = "email";
    } else if (format === "uri") {
        inputType = "url";
    } else if (format === "binary") {
        inputType = "file"; // For simplicity, treat binary as file input
    }

    return (
        <div key={param.name} className="flex items-center gap-2">
            <label className="w-24 text-xs font-medium text-slate-300">
                {param.name}
            </label>
            <input
                type={inputType}
                placeholder={param.description || `Enter ${param.name}` + (param.required ? " (required)" : "")}
                // value={pathParams[param.name] || ""}
                onChange={(e) =>
                    setPathParams({
                        ...pathParams,
                        [param.name]: inputType == 'file' ? e.target.files ? e.target.files[0] : "" : e.target.value,
                    })
                }
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            />
        </div>
    )
}

export default function TryItPanel({
    apiSpec,
    servers: serverUrls,
    endpoint,
    authToken,
    path,
    method,
}: TryItPanelProps) {
    // console.log(serverUrls)
    const [baseUrl, setBaseUrl] = useState(serverUrls[0].url || "");
    //   const [serverUrls, setServerUrls] = useState<string[]>([])
    const [pathParams, setPathParams] = useState<Record<string, string>>({});
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});
    const [requestBody, setRequestBody] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [headers, setHeaders] = useState<Record<string, string>>({
        "Content-Type": "application/json",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [copiedResponse, setCopiedResponse] = useState<string | null>(null);
    // const [expandedSections, setExpandedSections] = useState({
    //     params: true,
    //     headers: false,
    //     curl: false,
    // });
    const [bodyType, setBodyType] = useState("application/json");

    useEffect(() => {
        const newBodyType = Object.keys(endpoint.requestBody?.content || {})[0] || "application/json";
        setBodyType(newBodyType);
        if (newBodyType === "application/json") {
            const a = generateExampleFromSchemaWithRefs(getRequestBodySchema(endpoint), apiSpec)
            console.log("Generated request body:", a);
            setRequestBody(a);
        } else if (newBodyType === "multipart/form-data") {
            setRequestBody(new FormData());
        }
    }, [path, method])

    const buildRequestUrl = () => {
        let url = baseUrl.replace(/\/$/, ""); // Remove trailing slash
        let requestPath = path

        // Replace path parameters
        Object.entries(pathParams).forEach(([key, value]) => {
            requestPath = requestPath.replace(`{${key}}`, encodeURIComponent(value));
        });

        url += requestPath;

        // Add query parameters
        const queryString = Object.entries(queryParams)
            .filter(([_, value]) => value !== "")
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
            .join("&");

        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    };

    const executeRequest = async () => {
        setIsLoading(true);

        try {
            const url = buildRequestUrl();
            const requestOptions: RequestInit = {
                method: method.toUpperCase(),
                headers: {...headers},
            };

            // Add body for POST, PUT, PATCH requests
            if (
                ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
                requestBody
            ) {
                if (bodyType === "application/x-www-form-urlencoded") {
                    (requestOptions.headers as any)["Content-Type"] = "application/x-www-form-urlencoded";
                    requestOptions.body = new URLSearchParams(requestBody).toString();
                } else if (bodyType === "multipart/form-data") {
                    delete (requestOptions.headers as any)["Content-Type"]
                    requestOptions.body = requestBody; // FormData object
                } else {
                    (requestOptions.headers as any)["Content-Type"] = "application/json";
                    requestOptions.body = JSON.stringify(requestBody);
                }
            }

            console.log("Sending request:", { url, options: requestOptions });

            const response = await fetch(url, requestOptions);
            const responseData = await response.text();

            let parsedData;
            try {
                parsedData = JSON.parse(responseData);
            } catch {
                parsedData = responseData;
            }

            const newResponse = {
                id: Date.now(),
                method: method.toUpperCase(),
                path: path,
                url: url,
                requestBody: requestBody || null,
                headers: headers,
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    data: parsedData,
                },
                timestamp: new Date(),
            };

            setResponses([...responses, newResponse]);
        } catch (error) {
            console.error("Request failed:", error);
            const errorResponse = {
                id: Date.now(),
                method: method.toUpperCase(),
                path: path,
                url: buildRequestUrl(),
                requestBody: requestBody || null,
                headers: headers,
                response: {
                    status: 0,
                    statusText: "Network Error",
                    headers: {},
                    data: {
                        error: error instanceof Error ? error.message : "Request failed",
                    },
                },
                timestamp: new Date(),
            };
            setResponses([...responses, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, responseId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedResponse(responseId);
            setTimeout(() => setCopiedResponse(null), 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    };

    const generateCurlCommand = () => {
        const url = buildRequestUrl();
        let curl = `curl -X ${method.toUpperCase()}`;

        // Add headers
        Object.entries(headers).forEach(([key, value]) => {
            curl += ` \\\n  -H "${key}: ${value}"`;
        });

        // Add body for POST, PUT, PATCH requests
        if (
            ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
            requestBody
        ) {
            const bodyString =
                typeof requestBody === "string"
                    ? requestBody
                    : JSON.stringify(requestBody);
            curl += ` \\\n  -d '${bodyString}'`;
        }

        curl += ` \\\n  "${url}"`;
        return curl;
    };

    // console.log(endpoint)
    const pathParameters = endpoint ? getPathParameters(endpoint) : [];
    const queryParameters = endpoint ? getQueryParameters(endpoint) : [];

    return (
        // <div className="flex-1 xl:w-1/2 bg-slate-900 text-white overflow-y-auto dark-scrollbar">
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 flex flex-col h-full">
            {/* Header */}
            <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2">
                    Try it out
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-400">
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${method === "get"
                            ? "bg-green-500"
                            : method === "post"
                                ? "bg-blue-500"
                                : method === "put"
                                    ? "bg-orange-500"
                                    : method === "patch"
                                        ? "bg-yellow-500"
                                        : method === "delete"
                                            ? "bg-red-500"
                                            : "bg-gray-500"
                            }`}
                    >
                        {method.toUpperCase()}
                    </span>
                    <code className="bg-slate-800 px-2 py-1 rounded text-xs break-all mobile-text-xs">
                        {path}
                    </code>
                </div>
            </div>

            {/* Configuration */}
            <div className="space-y-3 sm:space-y-4">
                {/* Authentication Status */}
                {authToken && (
                    <div className="bg-green-900/50 border border-green-700 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm font-medium">Authenticated</span>
                        </div>
                        <div className="text-xs text-green-300">
                            Token: {authToken.substring(0, 20)}...
                        </div>
                    </div>
                )}

            </div>

            {/* Path Parameters */}
            {pathParameters.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Path Parameters</h3>
                    {pathParameters.map((param) => (
                        <ParameterItem
                            key={param.name}
                            param={param}
                            pathParams={pathParams}
                            setPathParams={setPathParams}
                        />))}
                </div>
            )}


            {/* Query Parameters */}
            {queryParameters.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Query Parameters</h3>
                    {queryParameters.map((param) => (
                        <ParameterItem
                            key={param.name}
                            param={param}
                            pathParams={queryParams}
                            setPathParams={setQueryParams}
                        />
                    ))}
                </div>
            )}

            {/* Request Body like Query Parameters*/}
            {endpoint.requestBody && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center justify-between">
                        Request Body

                        {/* select content type */}
                        <Select value={bodyType} onValueChange={(e1) => {
                            if (e1 === "application/json") {
                                setRequestBody(generateExampleFromSchemaWithRefs(getRequestBodySchema(endpoint), apiSpec));
                            }
                            else if (e1 === "multipart/form-data") {
                                setRequestBody(new FormData());
                            }
                            
                            setBodyType(e1)
                        }}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-28 h-8 px-2 py-1 text-sm">
                                <SelectValue placeholder="Content Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white">
                                {Object.keys(endpoint.requestBody?.content || {}).map((contentType) => (
                                    <SelectItem key={contentType} value={contentType}>
                                        {contentType}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </h3>

                    {bodyType === "application/json" && (
                        <textarea
                            value={requestBody ? JSON.stringify(requestBody, null, 2) : ""}
                            onChange={(e) => {
                                try {
                                    setRequestBody(JSON.parse(e.target.value));
                                } catch (error) {
                                    console.error("Invalid JSON:", error);
                                }
                            }}
                            placeholder="Enter JSON body"
                            className="w-full h-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        />
                    )}
                    {bodyType === "application/x-www-form-urlencoded" && (
                        <textarea
                            value={requestBody ? new URLSearchParams(requestBody).toString() : ""}
                            onChange={(e) => {
                                const params = new URLSearchParams(e.target.value);
                                const obj: Record<string, string> = {};
                                params.forEach((value, key) => {
                                    obj[key] = value;
                                });
                                setRequestBody(obj);
                            }}
                            placeholder="Enter form data"
                            className="w-full h-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        />
                    )}
                    {bodyType === "multipart/form-data" && (
                        <div className="text-sm text-slate-400 space-y-2">
                            {
                                endpoint.requestBody?.content?.["multipart/form-data"]?.schema?.properties &&
                                Object.entries(endpoint.requestBody.content["multipart/form-data"].schema.properties).map(
                                    ([key, value]) => (
                                        <ParameterItem
                                            key={key}
                                            param={{ name: key, schema: value }}
                                            pathParams={requestBody || {}}
                                            setPathParams={(params) => {
                                                setRequestBody( (formData: FormData) => {
                                                    const newFormData = new FormData();
                                                    for (const [k, v] of formData.entries()) {
                                                        newFormData.append(k, v);
                                                    }
                                                    newFormData.set(key, params[key] || "");
                                                    return newFormData;
                                                })
                                            }}
                                        />
                                    )
                                )
                            }
                        </div>
                    )}


                </div>
            )}

            {/* Send button */}

            <div className="flex items-center gap-2">
                <Button
                    onClick={executeRequest}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isLoading ? "Sending..." : "Send Request"}
                </Button>
                {/* move base url to this */}
                <Select value={baseUrl} onValueChange={setBaseUrl}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select server URL" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white">
                        {serverUrls.map((url) => (
                            <SelectItem key={url.url} value={url.url}>
                                {url.description || url.url}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>


            {/* Responses */}
            {responses.length > 0 && (
                <div className="flex-1 grid grid-rows-[auto_1fr]">
                    {/* height fix content */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 h-fit">
                        <h3 className="text-base sm:text-lg font-semibold">
                            Responses ({responses.length})
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResponses([])}
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear All
                        </Button>
                    </div>
                    <div className="h-full">
                        <div className="space-y-4">
                            {responses
                                .slice()
                                .reverse()
                                .map((response) => (
                                    <div
                                        //   key={response.id}
                                        className="bg-slate-800 rounded-lg p-3 sm:p-4"
                                    >
                                        {/* Response Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant={
                                                        response.response.status >= 200 &&
                                                            response.response.status < 300
                                                            ? "default"
                                                            : response.response.status >= 400
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {response.response.status}{" "}
                                                    {response.response.statusText}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    {response.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        JSON.stringify(response.response.data, null, 2),
                                                        response.id.toString()
                                                    )
                                                }
                                                className="text-slate-400 border-slate-600 w-full sm:w-auto"
                                            >
                                                {copiedResponse === response.id.toString() ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                                <span className="ml-2 sm:hidden">Copy Response</span>
                                            </Button>
                                        </div>

                                        {/* Request Info */}
                                        <div className="mb-3 text-xs text-slate-400 mobile-text-xs break-words">
                                            <div className="break-all">
                                                {response.method} {response.url}
                                            </div>
                                        </div>

                                        {/* Response Body */}
                                        <div className="bg-slate-900 p-2 sm:p-3 rounded overflow-x-auto max-h-48 sm:max-h-64">
                                            <pre className="text-xs sm:text-sm whitespace-pre-wrap mobile-text-xs break-words">
                                                {JSON.stringify(response.response.data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        // </div>
    );
}
