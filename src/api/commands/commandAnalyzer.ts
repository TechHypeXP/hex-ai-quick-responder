import * as vscode from 'vscode';
import { ProviderManager } from '../providers/providerManager';
import { CommandAnalysis } from './types';

export class CommandAnalyzer {
    private _providerManager: ProviderManager;

    constructor() {
        this._providerManager = ProviderManager.getInstance();
    }

    async analyzeCommand(
        command: string,
        args: string[],
        cwd: string
    ): Promise<CommandAnalysis> {
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const providerId = config.get<string>('selectedProvider') || 'openrouter';
        const provider = this._providerManager.getProvider(providerId);

        if (!provider) {
            throw new Error(`Selected provider ${providerId} not found`);
        }

        const modelId = config.get<string>('selectedModel') || provider.defaultModel;

        // Create analysis prompt
        const prompt = this._createAnalysisPrompt(command, args, cwd);

        try {
            const result = await this._providerManager.processMessage(
                providerId,
                modelId,
                prompt
            );

            return this._parseAnalysisResponse(result.content);
        } catch (error) {
            console.error('Command analysis failed:', error);
            throw error;
        }
    }

    private _createAnalysisPrompt(
        command: string,
        args: string[],
        cwd: string
    ): string {
        return `Analyze the safety of executing this command:
Command: ${command}
Arguments: ${args.join(' ')}
Working Directory: ${cwd}

Evaluate based on:
1. Command purpose and potential impact
2. Arguments and their implications
3. Working directory context
4. Known safe/unsafe patterns

Respond in JSON format:
{
    "isSafe": boolean,
    "confidence": number (0-1),
    "reasoning": string,
    "safePatterns": string[],
    "unsafePatterns": string[],
    "suggestedAction": "approve" | "deny" | "ask"
}`;
    }

    private _parseAnalysisResponse(response: string): CommandAnalysis {
        try {
            const analysis = JSON.parse(response);
            return {
                isSafe: analysis.isSafe || false,
                confidence: analysis.confidence || 0,
                reasoning: analysis.reasoning || '',
                safePatterns: analysis.safePatterns || [],
                unsafePatterns: analysis.unsafePatterns || [],
                suggestedAction: analysis.suggestedAction || 'ask'
            };
        } catch (error) {
            console.error('Failed to parse analysis response:', error);
            return {
                isSafe: false,
                confidence: 0,
                reasoning: 'Failed to analyze command',
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: 'ask'
            };
        }
    }
}
