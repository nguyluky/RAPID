import { useEffect, useState } from "react";


export default function useLoadingState(swaggerUrl?:string, asyncApiUrl?: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [swaggerSchema, setSwaggerSchema] = useState(null);
    const [asyncApiSchema, setAsyncApiSchema] = useState(null);

    useEffect(() => {
        const loadSchemas = async () => {
            setIsLoading(true);
            try {
                if (swaggerUrl) {
                    const response = await fetch(swaggerUrl);
                    const data = await response.json();
                    setSwaggerSchema(data);
                }
                if (asyncApiUrl) {
                    const response = await fetch(asyncApiUrl);
                    const data = await response.json();
                    setAsyncApiSchema(data);
                }
            } catch (error) {
                console.error("Error loading schemas:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSchemas();
    }, [])

    return {
        isLoading,
        swaggerSchema,
        asyncApiSchema
    }
}