import { injectable, inject } from 'inversify';
import { 
    ICommandAnalysisService, 
    CommandContext, 
    AnalysisResult, 
    SafetyAssessment,
    COMMAND_CATEGORIES
} from '../../core/interfaces/ICommandAnalysisService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';

@injectable()
export class CommandAnalysisService implements ICommandAnalysisService {
    // In-memory command history
    private _commandHistory: Array<{
        command: string;
        context: CommandContext;
        timestamp: number;
        outcome: any;
    }> = [];

    constructor(
        @inject(TYPES.providerManager) private _providerManager: IProviderManager
    ) {}

    async analyzeCommand(
        command: string, 
        context: CommandContext
    ): Promise<AnalysisResult> {
        try {
            // Use AI provider for advanced analysis
            const provider = await this._providerManager.selectBestProvider({
                complexity: this.determineComplexity(context)
            });

            // Process command through provider
            const providerResponse = await this._providerManager.processMessage({
                message: `Analyze command: ${command}`,
                context: { ...context, command }
            });

            // Determine command category and intent
            const category = this.categorizeCommand(command);
            const complexity = this.determineComplexity(context);

            return {
                intent: category,
                complexity,
                potentialActions: this.extractPotentialActions(command),
                confidenceScore: 0.8, // Placeholder confidence
                debugInfo: {
                    providerId: provider.id,
                    providerResponse
                }
            };
        } catch (error) {
            return {
                intent: 'unknown',
                complexity: 'low',
                potentialActions: [],
                confidenceScore: 0,
                debugInfo: { error: (error as Error).message }
            };
        }
    }

    async assessSafety(
        command: string, 
        context: CommandContext
    ): Promise<SafetyAssessment> {
        // Basic safety assessment
        const risks: string[] = [];

        // Check for potentially destructive commands
        const destructivePatterns = [
            /delete/i, 
            /remove/i, 
            /destroy/i, 
            /rm\s+-rf/i
        ];

        if (destructivePatterns.some(pattern => pattern.test(command))) {
            risks.push('Potentially destructive command detected');
        }

        // Check for sensitive file access
        const sensitiveFiles = [
            /\.env/i,
            /credentials/i,
            /secret/i,
            /config/i
        ];

        if (context.fileType && sensitiveFiles.some(pattern => pattern.test(context.fileType))) {
            risks.push('Potential access to sensitive configuration');
        }

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (risks.length > 1) riskLevel = 'high';
        else if (risks.length === 1) riskLevel = 'medium';

        return {
            isSafe: risks.length === 0,
            riskLevel,
            potentialIssues: risks,
            recommendedActions: risks.length > 0 
                ? ['Review command carefully', 'Confirm intent'] 
                : undefined
        };
    }

    async recordCommandOutcome(
        command: string, 
        context: CommandContext, 
        outcome: {
            success: boolean;
            details?: any;
        }
    ): Promise<void> {
        this._commandHistory.push({
            command,
            context,
            timestamp: Date.now(),
            outcome
        });

        // Limit history size
        if (this._commandHistory.length > 100) {
            this._commandHistory.shift();
        }
    }

    async suggestAlternatives(
        command: string, 
        context: CommandContext
    ): Promise<string[]> {
        // Basic alternative suggestion logic
        const alternatives: string[] = [];

        // Example suggestion logic
        if (command.includes('rename')) {
            alternatives.push('extract method');
            alternatives.push('create constant');
        }

        if (command.includes('generate')) {
            alternatives.push('scaffold project');
            alternatives.push('create boilerplate');
        }

        return alternatives;
    }

    async getCommandHistory(options?: {
        limit?: number;
        filterLanguage?: string;
    }): Promise<Array<{
        command: string;
        context: CommandContext;
        timestamp: number;
        outcome: any;
    }>> {
        let history = this._commandHistory;

        // Apply language filter if specified
        if (options?.filterLanguage) {
            history = history.filter(
                entry => entry.context.language === options.filterLanguage
            );
        }

        // Apply limit
        return history
            .slice(0, options?.limit || 10)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    // Helper method to categorize command
    private categorizeCommand(command: string): string {
        for (const [category, keywords] of Object.entries(COMMAND_CATEGORIES)) {
            if (keywords.some(keyword => command.toLowerCase().includes(keyword))) {
                return category.toLowerCase();
            }
        }
        return 'unknown';
    }

    // Helper method to determine complexity
    private determineComplexity(context: CommandContext): 'low' | 'medium' | 'high' {
        // Simple complexity estimation
        if (!context.currentSelection) return 'low';
        
        const selectionLength = context.currentSelection.length;
        if (selectionLength < 50) return 'low';
        if (selectionLength < 200) return 'medium';
        return 'high';
    }

    // Helper method to extract potential actions
    private extractPotentialActions(command: string): string[] {
        const actions: string[] = [];

        // Basic action extraction logic
        const actionKeywords = [
            'refactor', 'rename', 'generate', 
            'create', 'fix', 'optimize', 
            'document', 'explain'
        ];

        actionKeywords.forEach(keyword => {
            if (command.toLowerCase().includes(keyword)) {
                actions.push(keyword);
            }
        });

        return actions;
    }
}
