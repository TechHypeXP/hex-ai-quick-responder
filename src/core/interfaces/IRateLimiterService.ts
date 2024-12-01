export interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxConcurrentRequests: number;
    backoffStrategy: 'linear' | 'exponential' | 'fibonacci';
}

export interface RateLimitEvent {
    timestamp: number;
    providerId: string;
    modelId: string;
    isSuccessful: boolean;
    errorType?: 'rate_limit' | 'quota_exceeded' | 'network_error';
}

export interface RateLimitStatus {
    isAllowed: boolean;
    waitTimeMs: number;
    currentUsage: number;
    resetTimestamp?: number;
}

export interface IRateLimiterService {
    // Core rate limiting methods
    checkRateLimit(providerId: string, modelId: string): Promise<RateLimitStatus>;
    recordRequest(event: RateLimitEvent): Promise<void>;
    
    // Adaptive strategies
    calculateBackoffTime(failedAttempts: number): number;
    findAlternativeProvider(currentProviderId: string): Promise<string>;
    
    // Monitoring and reporting
    getCurrentProviderUsage(providerId: string): Promise<number>;
    getRecentLimitEvents(limit?: number): Promise<RateLimitEvent[]>;
    
    // Configuration methods
    updateRateLimitConfig(config: Partial<RateLimitConfig>): void;
    resetProviderStats(providerId: string): Promise<void>;
}
