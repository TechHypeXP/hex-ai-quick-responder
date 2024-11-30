import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { ProviderResponse } from './providers/types';
import { ErrorWithMessage } from './rateLimit/rateLimiter';

export class OpenRouterApi {
    private _config: vscode.WorkspaceConfiguration;
    private _baseUrl: string = "https://openrouter.ai/api/v1";

    constructor() {
        this._config = vscode.workspace.getConfiguration('hexQuickResponder');
    }

    private _getApiKey(): string {
        const apiKey = this._config.get<string>('openRouterApiKey');
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }
        return apiKey;
    }

    private _getModel(): string {
        return this._config.get<string>('openRouterModel') || 'qwen/qwq-32b-preview';
    }

    async processMessage(message: string): Promise<ProviderResponse> {
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

            const response = await fetch(`${this._baseUrl}/chat/completions`, {
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
                const errorData = await response.json() as ErrorWithMessage;
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
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }

    private _calculateCost(totalTokens: number): number {
        // Cost per 1k tokens for qwen/qwq-32b-preview is 0.0015
        const costPer1kTokens = 0.0015;
        return (totalTokens / 1000) * costPer1kTokens;
    }
}
