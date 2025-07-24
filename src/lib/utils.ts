import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMethodBadgeVariant(method: string) {
  switch (method.toLowerCase()) {
    case "get":
      return "default"; // Blue
    case "post":
      return "destructive"; // Red
    case "put":
      return "secondary"; // Orange/Yellow
    case "patch":
      return "outline"; // Gray outline
    case "delete":
      return "destructive"; // Red (same as POST for destructive operations)
    default:
      return "secondary";
  }
}

export function getMethodColor(method: string) {
  switch (method.toLowerCase()) {
    case "get":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "post":
      return "bg-green-100 text-green-800 border-green-200";
    case "put":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "patch":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "delete":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Generate example data based on OpenAPI schema
export function generateExampleFromSchema(schema: any): any {
  if (!schema) return {};

  if (schema.example) {
    return schema.example;
  }

  if (schema.type === "object" && schema.properties) {
    const example: any = {};
    Object.keys(schema.properties).forEach((key) => {
      example[key] = generateExampleFromSchema(schema.properties[key]);
    });
    return example;
  }

  if (schema.type === "array" && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }

  switch (schema.type) {
    case "string":
      if (schema.format === "email") return "user@example.com";
      if (schema.format === "date") return "2023-01-01";
      if (schema.format === "date-time") return "2023-01-01T00:00:00Z";
      return schema.example || "string";
    case "number":
    case "integer":
      return schema.example || 123;
    case "boolean":
      return schema.example !== undefined ? schema.example : true;
    default:
      return schema.example || null;
  }
}

// Get request body schema from endpoint
export function getRequestBodySchema(endpoint: any): any {
  if (!endpoint?.requestBody?.content) return null;

  const content = endpoint.requestBody.content;
  const jsonContent = content["application/json"];

  return jsonContent?.schema || null;
}

// Get response schema from endpoint
export function getResponseSchema(
  endpoint: any,
  statusCode: string = "200"
): any {
  if (!endpoint?.responses?.[statusCode]?.content) return null;

  const content = endpoint.responses[statusCode].content;
  const jsonContent = content["application/json"];

  return jsonContent?.schema || null;
}

// Format schema as pretty JSON string
export function formatSchemaExample(schema: any): string {
  if (!schema) return "{}";

  const example = generateExampleFromSchema(schema);
  return JSON.stringify(example, null, 2);
}

// Get path parameters from endpoint
export function getPathParameters(endpoint: any): any[] {
  return endpoint?.parameters?.filter((param: any) => param.in === 'path') || [];
}

// Get query parameters from endpoint
export function getQueryParameters(endpoint: any): any[] {
  return endpoint?.parameters?.filter((param: any) => param.in === 'query') || [];
}

// Get header parameters from endpoint
export function getHeaderParameters(endpoint: any): any[] {
  return endpoint?.parameters?.filter((param: any) => param.in === 'header') || [];
}

// Check if endpoint requires authentication
export function requiresAuth(endpoint: any, apiSpec: any): boolean {
  return !!(endpoint?.security || apiSpec?.security);
}

// Get security schemes from API spec
export function getSecuritySchemes(apiSpec: any): any {
  return apiSpec?.components?.securitySchemes || {};
}

// Resolve $ref references in schemas
export function resolveRef(ref: string, apiSpec: any): any {
  if (!ref || !ref.startsWith('#/')) return null;
  
  const path = ref.replace('#/', '').split('/');
  let resolved = apiSpec;
  
  for (const segment of path) {
    resolved = resolved?.[segment];
    if (!resolved) return null;
  }
  
  return resolved;
}

// Enhanced schema generation with $ref resolution
export function generateExampleFromSchemaWithRefs(schema: any, apiSpec: any): any {
  if (!schema) return {};

  // Resolve $ref if present
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, apiSpec);
    if (resolved) {
      return generateExampleFromSchemaWithRefs(resolved, apiSpec);
    }
  }

  if (schema.example) {
    return schema.example;
  }

  if (schema.type === "object" && schema.properties) {
    const example: any = {};
    Object.keys(schema.properties).forEach((key) => {
      example[key] = generateExampleFromSchemaWithRefs(schema.properties[key], apiSpec);
    });
    return example;
  }

  if (schema.type === "array" && schema.items) {
    return [generateExampleFromSchemaWithRefs(schema.items, apiSpec)];
  }

  switch (schema.type) {
    case "string":
      if (schema.format === "email") return "user@example.com";
      if (schema.format === "date") return "2023-01-01";
      if (schema.format === "date-time") return "2023-01-01T00:00:00Z";
      if (schema.format === "uuid") return "123e4567-e89b-12d3-a456-426614174000";
      return schema.example || "string";
    case "number":
    case "integer":
      return schema.example || 123;
    case "boolean":
      return schema.example !== undefined ? schema.example : true;
    default:
      return schema.example || null;
  }
}