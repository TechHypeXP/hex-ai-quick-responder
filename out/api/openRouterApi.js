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
exports.OpenRouterApi = void 0;
const vscode = __importStar(require("vscode"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class OpenRouterApi {
    constructor() {
        this._baseUrl = "https://openrouter.ai/api/v1";
        this._config = vscode.workspace.getConfiguration('hexQuickResponder');
    }
    _getApiKey() {
        const apiKey = this._config.get('openRouterApiKey');
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }
        return apiKey;
    }
    _getModel() {
        return this._config.get('openRouterModel') || 'qwen/qwq-32b-preview';
    }
    async processMessage(message) {
        try {
            const systemPrompt = `You are a highly efficient assistant focused on getting things done. 
            You follow the three iterations methodology:
            1. Understand the core problem by analyzing the request thoroughly
            2. Break it down into clear, actionable steps
            3. Execute with precise direction and bias towards completion
            
            Always provide clear, actionable responses that move tasks forward.
            Focus on practical solutions and avoid unnecessary conversation.`;
            const headers = {
                authorization: `Bearer ${this._getApiKey()}`,
                httpReferer: 'vscode-hex-quick-responder',
                xTitle: 'Hex Quick Responder',
                contentType: 'application/json'
            };
            const response = await (0, node_fetch_1.default)(`${this._baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: this._getModel(),
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
                throw new Error(`API Error: ${errorData.message || response.statusText}`);
            }
            const data = await response.json();
            return {
                content: data.choices[0]?.message?.content || 'No response generated',
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                    estimatedCost: this._calculateCost(data.usage?.total_tokens || 0)
                }
            };
        }
        catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }
    _calculateCost(totalTokens) {
        // Cost per 1k tokens for qwen/qwq-32b-preview is 0.0015
        const costPer1kTokens = 0.0015;
        return (totalTokens / 1000) * costPer1kTokens;
    }
}
exports.OpenRouterApi = OpenRouterApi;
//# sourceMappingURL=openRouterApi.js.map