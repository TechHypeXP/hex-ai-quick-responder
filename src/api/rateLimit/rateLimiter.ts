export interface ErrorWithMessage {
    message?: string;
}

interface RateLimitState {
    lastRequestTime: number;
    consecutiveFailures: number;
    currentBackoff: number;
    isInCooldown: boolean;
}

export class RateLimiter {
    private static _instance: RateLimiter;
    private _providerStates: Map<string, RateLimitState>;
    
    private readonly _minBackoff = 30000; // 30 seconds
    private readonly _maxBackoff = 600000; // 10 minutes
    private readonly _backoffMultiplier = 2;
    private readonly _cooldownResetTime = 300000; // 5 minutes of success to reset backoff

    private constructor() {
        this._providerStates = new Map();
    }

    static getInstance(): RateLimiter {
        if (!RateLimiter._instance) {
            RateLimiter._instance = new RateLimiter();
        }
        return RateLimiter._instance;
    }

    private _getProviderState(providerId: string): RateLimitState {
        if (!this._providerStates.has(providerId)) {
            this._providerStates.set(providerId, {
                lastRequestTime: 0,
                consecutiveFailures: 0,
                currentBackoff: this._minBackoff,
                isInCooldown: false
            });
        }
        return this._providerStates.get(providerId)!;
    }

    private _calculateBackoff(state: RateLimitState): number {
        // Exponential backoff with jitter
        const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
        return Math.min(
            state.currentBackoff * this._backoffMultiplier * jitter,
            this._maxBackoff
        );
    }

    async checkRateLimit(providerId: string): Promise<void> {
        const state = this._getProviderState(providerId);
        const now = Date.now();

        // Check if we need to wait
        if (state.isInCooldown) {
            const timeToWait = state.currentBackoff - (now - state.lastRequestTime);
            if (timeToWait > 0) {
                console.log(`Rate limit cooldown for ${providerId}: waiting ${timeToWait}ms`);
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }
        }

        // Update last request time
        state.lastRequestTime = Date.now();
    }

    handleSuccess(providerId: string): void {
        const state = this._getProviderState(providerId);
        const now = Date.now();
        
        // If we've had a period of success, start reducing backoff
        if (now - state.lastRequestTime > this._cooldownResetTime) {
            state.consecutiveFailures = 0;
            state.currentBackoff = this._minBackoff;
            state.isInCooldown = false;
        }
    }

    handleError(providerId: string, error: ErrorWithMessage): void {
        const state = this._getProviderState(providerId);
        
        // Check if error indicates rate limiting or model exhaustion
        const isRateLimitError = this._isRateLimitError(error);
        
        if (isRateLimitError) {
            state.consecutiveFailures++;
            state.currentBackoff = this._calculateBackoff(state);
            state.isInCooldown = true;
            
            console.log(`Rate limit triggered for ${providerId}. New backoff: ${state.currentBackoff}ms`);
        }
    }

    private _isRateLimitError(error: ErrorWithMessage): boolean {
        const errorMessage = error?.message?.toLowerCase() || '';
        return (
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('model capacity') ||
            errorMessage.includes('token limit exceeded') ||
            errorMessage.includes('timeout')
        );
    }

    getProviderStatus(providerId: string): {
        isInCooldown: boolean;
        currentBackoff: number;
        consecutiveFailures: number;
    } {
        const state = this._getProviderState(providerId);
        return {
            isInCooldown: state.isInCooldown,
            currentBackoff: state.currentBackoff,
            consecutiveFailures: state.consecutiveFailures
        };
    }
}
