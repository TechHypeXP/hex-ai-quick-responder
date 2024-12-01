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
