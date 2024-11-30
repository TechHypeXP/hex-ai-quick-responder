"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderManager = void 0;
const dotenv = __importStar(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const defaultProviders_1 = require("./defaultProviders");
const rateLimiter_1 = require("../rateLimit/rateLimiter");
class ProviderManager {
    constructor() {
        this._providers = new Map();
        this._credentials = new Map();
        this._rateLimiter = rateLimiter_1.RateLimiter.getInstance();
        this._loadDefaultProviders();
        this._loadCredentials();
    }
    static getInstance() {
        if (!ProviderManager._instance) {
            ProviderManager._instance = new ProviderManager();
        }
        return ProviderManager._instance;
    }
    _loadDefaultProviders() {
        defaultProviders_1.defaultProviders.forEach(provider => {
            this._providers.set(provider.id, provider);
        });
    }
    _loadCredentials() {
        dotenv.config();
        // Use entries() to get both key and value
        Array.from(this._providers.entries()).forEach(([id]) => {
            const apiKey = process.env[`${id.toUpperCase()}_API_KEY`];
            if (apiKey) {
                this._credentials.set(id, { apiKey });
            }
        });
    }
    getProviders() {
        return Array.from(this._providers.values());
    }
    getProvider(id) {
        return this._providers.get(id);
    }
    getModels(providerId) {
        const provider = this._providers.get(providerId);
        return provider ? provider.models.map(model => model.id) : [];
    }
    addCustomProvider(config) {
        if (this._providers.has(config.id)) {
            throw new Error(`Provider with ID ${config.id} already exists`);
        }
        this._providers.set(config.id, config);
    }
    getProviderStatus(providerId) {
        return this._rateLimiter.getProviderStatus(providerId);
    }
    async processMessage(providerId, modelId, message) {
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
            const response = await (0, node_fetch_1.default)(`${provider.baseUrl}/chat/completions`, {
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
                const errorData = await response.json();
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
        }
        catch (error) {
            console.error('Provider processing error:', error);
            this._rateLimiter.handleError(providerId, error);
            throw error;
        }
    }
}
exports.ProviderManager = ProviderManager;
//# sourceMappingURL=providerManager.js.map