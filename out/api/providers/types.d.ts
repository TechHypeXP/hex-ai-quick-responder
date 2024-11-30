export interface ModelInfo {
    id: string;
    name: string;
    contextLength: number;
    costPer1kTokens: number;
    description?: string;
}
export interface ProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    headerTemplate: {
        [key: string]: string;
    };
    models: ModelInfo[];
    defaultModel: string;
}
export interface ProviderCredentials {
    apiKey: string;
    [key: string]: string;
}
export interface ProviderResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        estimatedCost: number;
    };
}
