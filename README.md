



# define schema
- api rest: openapi

- socket io: 
```ts
type SocketIOSchema = {
  name: string;
  description: string;
  version: string;
  servers: Array<{
    url: string;
    description: string;
  }>;
  name_spaces: Array<{
    name: string;
    description: string;
    emits: Array<{
      name: string;
      description: string;
      schema: "jsonSchema";
    }>;
    listens: Array<{
      name: string;
      description: string;
      parameters: Array<{
        name: string;
        type: string;
        schema: "jsonSchema";
      }>;
    }>;
    // 👇 Thêm yêu cầu xác thực cho từng namespace nếu cần
    security?: Array<{
      scheme: string;
      scopes?: string[];
    }>;
  }>;
  components: {
    schemas: Record<string, any>; // JSON Schema definitions
    // 👇 Thêm phần securitySchemes như trong OpenAPI
    securitySchemes?: Record<
      string,
      {
        type: "apiKey" | "http" | "oauth2" | "openIdConnect";
        name?: string; // For apiKey
        in?: "query" | "header" | "cookie";
        scheme?: string; // For http type
        bearerFormat?: string; // For http bearer
        description?: string;
      }
    >;
  };
  // 👇 Có thể định nghĩa security toàn cục tại đây
  security?: Array<{
    scheme: string;
    scopes?: string[];
  }>;
};
```
