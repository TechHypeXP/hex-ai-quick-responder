import { ProviderConfig, AIModelConfig } from '../../core/config/providerConfig';

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTimestamp: number;
    currentUsage: number;
}

export interface ProviderRateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxConcurrentRequests: number;
}

export interface Provider {
    id: string;
    name: string;
    models: string[];
    rateLimitConfig: ProviderRateLimitConfig;
    processMessage(modelId: string, prompt: string): Promise<ProviderResponse>;
    getCurrentRateLimitInfo(): RateLimitInfo;
}

export interface ProviderResponse {
    content: string;
    metadata?: {
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        model?: string;
        finishReason?: string;
        rateLimitInfo?: RateLimitInfo;
    };
}

export interface ProviderHealthStatus {
    isHealthy: boolean;
    lastChecked: number;
    responseTime: number;
    errorRate: number;
}

export interface AIProviderResponse {
    content: string;
    tokens?: number;
    providerId: string;
    modelId: string;
    timestamp: number;
}

export interface IProviderManager {
    // Core Provider Management
    getDefaultProvider(): Promise<ProviderConfig>;
    getProvider(providerId: string): Promise<ProviderConfig>;
    getAllProviders(): Promise<ProviderConfig[]>;
    
    // Provider Selection and Routing
    selectBestProvider(requirements?: {
        maxTokens?: number;
        complexity?: 'low' | 'medium' | 'high';
    }): Promise<ProviderConfig>;

    // Provider Interaction
    processMessage(params: {
        message: string;
        providerId?: string;
        modelId?: string;
        context?: Record<string, any>;
    }): Promise<AIProviderResponse>;

    // Health and Performance Monitoring
    checkProviderHealth(providerId: string): Promise<ProviderHealthStatus>;
    getProviderPerformanceHistory(providerId: string): Promise<ProviderHealthStatus[]>;

    // Configuration and Dynamic Management
    updateProviderConfig(providerId: string, config: Partial<ProviderConfig>): Promise<void>;
    addProvider(providerConfig: ProviderConfig): Promise<void>;
    removeProvider(providerId: string): Promise<void>;

    // Error Handling and Fallback
    handleProviderFailure(providerId: string, error: Error): Promise<ProviderConfig>;
}
