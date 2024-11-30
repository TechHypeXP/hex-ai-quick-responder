import { ProviderConfig, ProviderResponse } from './types';
export declare class ProviderManager {
    private static _instance;
    private _providers;
    private _credentials;
    private _rateLimiter;
    private constructor();
    static getInstance(): ProviderManager;
    private _loadDefaultProviders;
    private _loadCredentials;
    getProviders(): ProviderConfig[];
    getProvider(id: string): ProviderConfig | undefined;
    getModels(providerId: string): string[];
    addCustomProvider(config: ProviderConfig): void;
    getProviderStatus(providerId: string): {
        isInCooldown: boolean;
        currentBackoff: number;
        consecutiveFailures: number;
    };
    processMessage(providerId: string, modelId: string, message: string): Promise<ProviderResponse>;
}
