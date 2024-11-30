import { ProviderResponse } from './providers/types';
export declare class OpenRouterApi {
    private _config;
    private _baseUrl;
    constructor();
    private _getApiKey;
    private _getModel;
    processMessage(message: string): Promise<ProviderResponse>;
    private _calculateCost;
}
