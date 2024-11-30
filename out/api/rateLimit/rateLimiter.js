"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor() {
        this._minBackoff = 30000; // 30 seconds
        this._maxBackoff = 600000; // 10 minutes
        this._backoffMultiplier = 2;
        this._cooldownResetTime = 300000; // 5 minutes of success to reset backoff
        this._providerStates = new Map();
    }
    static getInstance() {
        if (!RateLimiter._instance) {
            RateLimiter._instance = new RateLimiter();
        }
        return RateLimiter._instance;
    }
    _getProviderState(providerId) {
        if (!this._providerStates.has(providerId)) {
            this._providerStates.set(providerId, {
                lastRequestTime: 0,
                consecutiveFailures: 0,
                currentBackoff: this._minBackoff,
                isInCooldown: false
            });
        }
        return this._providerStates.get(providerId);
    }
    _calculateBackoff(state) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
        return Math.min(state.currentBackoff * this._backoffMultiplier * jitter, this._maxBackoff);
    }
    async checkRateLimit(providerId) {
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
    handleSuccess(providerId) {
        const state = this._getProviderState(providerId);
        const now = Date.now();
        // If we've had a period of success, start reducing backoff
        if (now - state.lastRequestTime > this._cooldownResetTime) {
            state.consecutiveFailures = 0;
            state.currentBackoff = this._minBackoff;
            state.isInCooldown = false;
        }
    }
    handleError(providerId, error) {
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
    _isRateLimitError(error) {
        const errorMessage = error?.message?.toLowerCase() || '';
        return (errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests') ||
            errorMessage.includes('model capacity') ||
            errorMessage.includes('token limit exceeded') ||
            errorMessage.includes('timeout'));
    }
    getProviderStatus(providerId) {
        const state = this._getProviderState(providerId);
        return {
            isInCooldown: state.isInCooldown,
            currentBackoff: state.currentBackoff,
            consecutiveFailures: state.consecutiveFailures
        };
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map