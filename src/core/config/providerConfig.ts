export interface ProviderLimits {
    // Pricing and usage dimensions
    monthlyTokenLimit: number;
    monthlyRequestLimit: number;
    
    // Rate limiting specifics
    requestsPerMinute: number;
    requestsPerHour: number;
    concurrentRequestLimit: number;
    
    // Cost tracking
    costPerThousandTokens: number;
    
    // Billing cycle
    billingCycle: 'monthly' | 'per-request' | 'prepaid';
    
    // Overage and throttling policies
    overagePolicy: 'block' | 'charge' | 'throttle';
}

export interface AIModelConfig {
    modelId: string;
    name: string;
    context_window: number;
    input_cost_per_1k_tokens: number;
    output_cost_per_1k_tokens: number;
    max_tokens: number;
}

export interface ProviderConfig {
    // Service Provider Details
    id: string;
    name: string;
    type: 'model_provider' | 'api_aggregator' | 'inference_service';
    
    // Authentication
    authMethod: 'api_key' | 'oauth' | 'jwt';
    
    // Limits and Pricing
    limits: ProviderLimits;
    
    // Supported Models
    models: AIModelConfig[];
    
    // Geographical Restrictions
    allowedRegions?: string[];
    
    // Performance Metrics
    averageLatency?: number;
    reliability_score?: number;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        type: 'model_provider',
        authMethod: 'api_key',
        limits: {
            monthlyTokenLimit: 2_000_000,
            monthlyRequestLimit: 10_000,
            requestsPerMinute: 60,
            requestsPerHour: 500,
            concurrentRequestLimit: 5,
            costPerThousandTokens: 0.02,
            billingCycle: 'monthly',
            overagePolicy: 'throttle'
        },
        models: [
            {
                modelId: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                context_window: 4096,
                input_cost_per_1k_tokens: 0.0015,
                output_cost_per_1k_tokens: 0.002,
                max_tokens: 4096
            },
            {
                modelId: 'gpt-4',
                name: 'GPT-4',
                context_window: 8192,
                input_cost_per_1k_tokens: 0.03,
                output_cost_per_1k_tokens: 0.06,
                max_tokens: 8192
            }
        ],
        averageLatency: 500,
        reliability_score: 0.99
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        type: 'model_provider',
        authMethod: 'api_key',
        limits: {
            monthlyTokenLimit: 1_000_000,
            monthlyRequestLimit: 5_000,
            requestsPerMinute: 30,
            requestsPerHour: 300,
            concurrentRequestLimit: 3,
            costPerThousandTokens: 0.03,
            billingCycle: 'monthly',
            overagePolicy: 'block'
        },
        models: [
            {
                modelId: 'claude-2',
                name: 'Claude 2',
                context_window: 100_000,
                input_cost_per_1k_tokens: 0.008,
                output_cost_per_1k_tokens: 0.024,
                max_tokens: 100_000
            }
        ],
        averageLatency: 750,
        reliability_score: 0.97
    },
    openrouter: {
        id: 'openrouter',
        name: 'Open Router',
        type: 'api_aggregator',
        authMethod: 'api_key',
        limits: {
            monthlyTokenLimit: 5_000_000,
            monthlyRequestLimit: 20_000,
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            concurrentRequestLimit: 10,
            costPerThousandTokens: 0.01,
            billingCycle: 'per-request',
            overagePolicy: 'charge'
        },
        models: [
            {
                modelId: 'mistral-7b',
                name: 'Mistral 7B',
                context_window: 8192,
                input_cost_per_1k_tokens: 0.0002,
                output_cost_per_1k_tokens: 0.0002,
                max_tokens: 8192
            },
            {
                modelId: 'claude-2',
                name: 'Claude 2 via Open Router',
                context_window: 100_000,
                input_cost_per_1k_tokens: 0.01,
                output_cost_per_1k_tokens: 0.03,
                max_tokens: 100_000
            }
        ],
        averageLatency: 1000,
        reliability_score: 0.95
    }
};

// Utility function to get provider config
export function getProviderConfig(providerId: string): ProviderConfig {
    const config = PROVIDER_CONFIGS[providerId];
    if (!config) {
        throw new Error(`Provider configuration not found for: ${providerId}`);
    }
    return config;
}

// Utility function to check if a provider is available
export function isProviderAvailable(providerId: string): boolean {
    try {
        const config = getProviderConfig(providerId);
        // Add more sophisticated availability checks if needed
        return config.reliability_score && config.reliability_score > 0.9;
    } catch {
        return false;
    }
}

// Utility function to find alternative providers
export function findAlternativeProviders(currentProviderId: string): string[] {
    return Object.keys(PROVIDER_CONFIGS)
        .filter(id => 
            id !== currentProviderId && 
            isProviderAvailable(id)
        );
}
