import { injectable, inject } from 'inversify';
import { IRateLimiterService, RateLimitConfig, RateLimitEvent, RateLimitStatus } from '../../core/interfaces/IRateLimiterService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';
import { 
    PROVIDER_CONFIGS, 
    getProviderConfig, 
    findAlternativeProviders 
} from '../../core/config/providerConfig';

@injectable()
export class RateLimiterService implements IRateLimiterService {
    private _providerUsage: Map<string, number> = new Map();
    private _recentEvents: RateLimitEvent[] = [];
    private _config: RateLimitConfig = {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 500,
        maxConcurrentRequests: 10,
        backoffStrategy: 'exponential'
    };
    private _providerFailureCount: Map<string, number> = new Map();

    // Track monthly usage per provider
    private _monthlyProviderUsage: Map<string, {
        tokenUsage: number;
        requestCount: number;
        lastResetTimestamp: number;
    }> = new Map();

    constructor(
        @inject(TYPES.providerManager) private _providerManager: IProviderManager
    ) {
        // Initialize monthly tracking for each provider
        Object.keys(PROVIDER_CONFIGS).forEach(providerId => {
            this._monthlyProviderUsage.set(providerId, {
                tokenUsage: 0,
                requestCount: 0,
                lastResetTimestamp: Date.now()
            });
        });
    }

    // Enhanced method to check comprehensive rate limits
    async checkRateLimit(providerId: string, modelId: string): Promise<RateLimitStatus> {
        const providerConfig = getProviderConfig(providerId);
        const monthlyUsage = this._monthlyProviderUsage.get(providerId);

        if (!monthlyUsage) {
            throw new Error(`No usage tracking for provider: ${providerId}`);
        }

        // Check monthly limits
        const isMonthlyLimitExceeded = 
            monthlyUsage.tokenUsage >= providerConfig.limits.monthlyTokenLimit ||
            monthlyUsage.requestCount >= providerConfig.limits.monthlyRequestLimit;

        // Check rate limits
        const currentMinuteUsage = await this.getCurrentProviderUsage(providerId);
        const isRateLimitExceeded = 
            currentMinuteUsage >= providerConfig.limits.requestsPerMinute;

        // Determine overall status
        const isAllowed = !isMonthlyLimitExceeded && !isRateLimitExceeded;

        return {
            isAllowed,
            waitTimeMs: isAllowed ? 0 : this.calculateBackoffTime(
                this._providerFailureCount.get(providerId) || 0
            ),
            currentUsage: currentMinuteUsage,
            monthlyTokenUsage: monthlyUsage.tokenUsage,
            monthlyRequestCount: monthlyUsage.requestCount
        };
    }

    // Method to record request with comprehensive tracking
    async recordRequest(event: RateLimitEvent & { 
        tokenUsage?: number 
    }): Promise<void> {
        const { providerId, modelId, isSuccessful, tokenUsage = 0 } = event;
        
        // Update monthly usage
        const monthlyUsage = this._monthlyProviderUsage.get(providerId);
        if (monthlyUsage) {
            monthlyUsage.tokenUsage += tokenUsage;
            monthlyUsage.requestCount++;

            // Reset monthly usage if needed
            const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - monthlyUsage.lastResetTimestamp > THIRTY_DAYS) {
                monthlyUsage.tokenUsage = 0;
                monthlyUsage.requestCount = 0;
                monthlyUsage.lastResetTimestamp = Date.now();
            }
        }

        // Existing request tracking logic...
        this._recentEvents.unshift(event);
        this._recentEvents = this._recentEvents.slice(0, 100);

        // Update provider usage
        const key = `${event.providerId}:${event.modelId}`;
        const currentUsage = this._providerUsage.get(key) || 0;
        this._providerUsage.set(key, currentUsage + 1);

        // Track failure count for backoff
        if (!isSuccessful) {
            const failureCount = (this._providerFailureCount.get(providerId) || 0) + 1;
            this._providerFailureCount.set(providerId, failureCount);
        }
    }

    // Enhanced alternative provider selection
    async findAlternativeProvider(currentProviderId: string): Promise<string> {
        const alternativeProviders = findAlternativeProviders(currentProviderId);
        
        if (alternativeProviders.length === 0) {
            throw new Error('No alternative providers available');
        }

        // Select provider with least monthly usage
        return alternativeProviders.reduce((bestProvider, currentProvider) => {
            const currentUsage = this._monthlyProviderUsage.get(currentProvider)?.tokenUsage || 0;
            const bestUsage = this._monthlyProviderUsage.get(bestProvider)?.tokenUsage || 0;
            
            return currentUsage < bestUsage ? currentProvider : bestProvider;
        });
    }

    calculateBackoffTime(failedAttempts: number): number {
        switch (this._config.backoffStrategy) {
            case 'linear':
                return failedAttempts * 1000; // Linear: 1s, 2s, 3s...
            case 'fibonacci':
                // Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13...
                const fib = (n: number): number => 
                    n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
                return fib(failedAttempts + 2) * 1000;
            case 'exponential':
            default:
                return Math.pow(2, failedAttempts) * 1000; // Exponential: 1s, 2s, 4s, 8s...
        }
    }

    async getCurrentProviderUsage(providerId: string): Promise<number> {
        // Filter events in the last minute
        const now = Date.now();
        const recentEvents = this._recentEvents.filter(
            event => event.providerId === providerId && 
                     now - event.timestamp < 60000 && 
                     event.isSuccessful
        );
        return recentEvents.length;
    }

    getRecentLimitEvents(limit = 10): Promise<RateLimitEvent[]> {
        return Promise.resolve(this._recentEvents.slice(0, limit));
    }

    updateRateLimitConfig(config: Partial<RateLimitConfig>): void {
        this._config = { ...this._config, ...config };
    }

    async resetProviderStats(providerId: string): Promise<void> {
        this._providerUsage.delete(providerId);
        this._providerFailureCount.delete(providerId);
        
        // Filter out events for this provider
        this._recentEvents = this._recentEvents.filter(
            event => event.providerId !== providerId
        );

        // Reset monthly usage
        this._monthlyProviderUsage.set(providerId, {
            tokenUsage: 0,
            requestCount: 0,
            lastResetTimestamp: Date.now()
        });
    }
}
