// Provider Types
export interface ProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    headerTemplate: Record<string, string>;
    models: ModelConfig[];
    defaultModel: string;
}

export interface ModelConfig {
    id: string;
    name: string;
    contextLength: number;
    costPer1kTokens: number;
    description: string;
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

// Command Types
export interface CommandConfig {
    command: string;
    autoApprove?: boolean;
    safePatterns?: string[];
    unsafePatterns?: string[];
    response?: 'approve' | 'deny' | 'ask';
    isDefault?: boolean;
}

export interface CommandAnalysis {
    isSafe: boolean;
    confidence: number;
    reasoning: string;
    safePatterns: string[];
    unsafePatterns: string[];
    suggestedAction: 'approve' | 'deny' | 'ask';
}

// RAG Types
export interface RagContext {
    type: 'business' | 'improvement' | 'development';
    content: string;
    metadata: {
        timestamp: number;
        confidence: number;
        source: string;
        category: string[];
    };
}

export interface LearningEntry {
    pattern: string;
    outcome: 'success' | 'failure';
    context: string;
    timestamp: number;
    improvement?: string;
}
