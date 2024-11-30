import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { ProviderConfig, ProviderCredentials, ProviderResponse } from './types';
import { defaultProviders } from './defaultProviders';
import { RateLimiter, ErrorWithMessage } from '../rateLimit/rateLimiter';

export class ProviderManager {
    private static _instance: ProviderManager;
    private _providers: Map<string, ProviderConfig>;
    private _credentials: Map<string, ProviderCredentials>;
    private _rateLimiter: RateLimiter;

    private constructor() {
        this._providers = new Map();
        this._credentials = new Map();
        this._rateLimiter = RateLimiter.getInstance();
        this._loadDefaultProviders();
        this._loadCredentials();
    }

    static getInstance(): ProviderManager {
        if (!ProviderManager._instance) {
            ProviderManager._instance = new ProviderManager();
        }
        return ProviderManager._instance;
    }

    private _loadDefaultProviders(): void {
        defaultProviders.forEach(provider => {
            this._providers.set(provider.id, provider);
        });
    }

    private _loadCredentials(): void {
        dotenv.config();
        // Use entries() to get both key and value
        Array.from(this._providers.entries()).forEach(([id]) => {
            const apiKey = process.env[`${id.toUpperCase()}_API_KEY`];
            if (apiKey) {
                this._credentials.set(id, { apiKey });
            }
        });
    }

    getProviders(): ProviderConfig[] {
        return Array.from(this._providers.values());
    }

    getProvider(id: string): ProviderConfig | undefined {
        return this._providers.get(id);
    }

    getModels(providerId: string): string[] {
        const provider = this._providers.get(providerId);
        return provider ? provider.models.map(model => model.id) : [];
    }

    addCustomProvider(config: ProviderConfig): void {
        if (this._providers.has(config.id)) {
            throw new Error(`Provider with ID ${config.id} already exists`);
        }
        this._providers.set(config.id, config);
    }

    getProviderStatus(providerId: string): {
        isInCooldown: boolean;
        currentBackoff: number;
        consecutiveFailures: number;
    } {
        return this._rateLimiter.getProviderStatus(providerId);
    }

    async processMessage(providerId: string, modelId: string, message: string): Promise<ProviderResponse> {
        try {
            // Check rate limits before proceeding
            await this._rateLimiter.checkRateLimit(providerId);

            const provider = this._providers.get(providerId);
            const credentials = this._credentials.get(providerId);
            
            if (!provider || !credentials) {
                throw new Error(`Provider ${providerId} not found or not configured`);
            }

            const model = provider.models.find(m => m.id === modelId);
            if (!model) {
                throw new Error(`Model ${modelId} not found for provider ${providerId}`);
            }

            const systemPrompt = `You are a highly efficient assistant focused on getting things done. 
            You follow the three iterations methodology:
            1. Understand the core problem by analyzing the request thoroughly
            2. Break it down into clear, actionable steps
            3. Execute with precise direction and bias towards completion
            
            Always provide clear, actionable responses that move tasks forward.
            Focus on practical solutions and avoid unnecessary conversation.`;

            const headers = {
                authorization: `Bearer ${credentials.apiKey}`,
                contentType: "application/json",
                ...provider.headerTemplate
            };

            const response = await fetch(`${provider.baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    maxTokens: 2000,
                    topP: 0.9,
                    frequencyPenalty: 0.5,
                    presencePenalty: 0.3
                })
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorWithMessage;
                const error = new Error(`API Error: ${errorData.message || response.statusText}`);
                this._rateLimiter.handleError(providerId, error);
                throw error;
            }

            const data = await response.json();
            
            // Handle successful response
            this._rateLimiter.handleSuccess(providerId);

            return {
                content: data.choices[0]?.message?.content || 'No response generated',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                    estimatedCost: (data.usage?.total_tokens || 0) * model.costPer1kTokens / 1000
                }
            };
        } catch (error) {
            console.error('Provider processing error:', error);
            this._rateLimiter.handleError(providerId, error as ErrorWithMessage);
            throw error;
        }
    }
}
