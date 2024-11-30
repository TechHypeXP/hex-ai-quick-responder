export interface ErrorWithMessage {
    message?: string;
}
export declare class RateLimiter {
    private static _instance;
    private _providerStates;
    private readonly _minBackoff;
    private readonly _maxBackoff;
    private readonly _backoffMultiplier;
    private readonly _cooldownResetTime;
    private constructor();
    static getInstance(): RateLimiter;
    private _getProviderState;
    private _calculateBackoff;
    checkRateLimit(providerId: string): Promise<void>;
    handleSuccess(providerId: string): void;
    handleError(providerId: string, error: ErrorWithMessage): void;
    private _isRateLimitError;
    getProviderStatus(providerId: string): {
        isInCooldown: boolean;
        currentBackoff: number;
        consecutiveFailures: number;
    };
}
