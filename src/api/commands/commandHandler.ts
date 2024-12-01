import * as vscode from 'vscode';
import { CommandConfig, CommandAnalysis } from '../../types';
import { ProviderManager } from '../providers/providerManager';

export class CommandHandler {
    private static _instance: CommandHandler;
    private _providerManager: ProviderManager;
    private _safeCommands: Set<string>;

    private constructor() {
        this._providerManager = ProviderManager.getInstance();
        this._safeCommands = new Set(['npm install', 'git pull', 'git status']);
    }

    static getInstance(): CommandHandler {
        if (!CommandHandler._instance) {
            CommandHandler._instance = new CommandHandler();
        }
        return CommandHandler._instance;
    }

    async handleCommandApproval(
        command: string, 
        args: string[], 
        cwd: string
    ): Promise<boolean> {
        const fullCommand = `${command} ${args.join(' ')}`.trim();
        
        // Quick check for known safe commands
        if (this._safeCommands.has(fullCommand)) {
            await this._logLearning({
                pattern: fullCommand,
                outcome: 'success',
                context: `Auto-approved known safe command: ${fullCommand}`,
                timestamp: Date.now()
            });
            return true;
        }

        // For unknown commands, use AI to analyze
        try {
            const analysis = await this._analyzeCommand(fullCommand, cwd);
            
            if (analysis.confidence > 0.8 && analysis.isSafe) {
                this._safeCommands.add(fullCommand);
                await this._logLearning({
                    pattern: fullCommand,
                    outcome: 'success',
                    context: analysis.reasoning,
                    timestamp: Date.now(),
                    improvement: 'Added to safe commands list'
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Command analysis error:', error);
            return false;
        }
    }

    private async _analyzeCommand(
        command: string,
        cwd: string
    ): Promise<CommandAnalysis> {
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const providerId = config.get<string>('selectedProvider') || 'openrouter';
        const provider = this._providerManager.getProvider(providerId);

        if (!provider) {
            throw new Error(`Selected provider ${providerId} not found`);
        }

        const prompt = `Analyze if this command is safe to execute:
Command: ${command}
Working Directory: ${cwd}

Respond in JSON format:
{
    "isSafe": boolean,
    "confidence": number (0-1),
    "reasoning": string
}`;

        const result = await this._providerManager.processMessage(
            providerId,
            provider.defaultModel,
            prompt
        );

        try {
            const analysis = JSON.parse(result.content);
            return {
                isSafe: analysis.isSafe || false,
                confidence: analysis.confidence || 0,
                reasoning: analysis.reasoning || '',
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: analysis.isSafe ? 'approve' : 'deny'
            };
        } catch {
            return {
                isSafe: false,
                confidence: 0,
                reasoning: 'Failed to analyze command',
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: 'deny'
            };
        }
    }

    private async _logLearning(entry: any): Promise<void> {
        // For now, just log to console
        console.log('Learning:', entry);
        // TODO: Implement RAG storage and analysis
    }
}
