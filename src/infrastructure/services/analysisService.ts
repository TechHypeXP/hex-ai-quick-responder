import { injectable, inject } from 'inversify';
import { IAnalysisService } from '../../core/interfaces/IAnalysisService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { CommandAnalysis } from '../../types';
import { TYPES } from '../types';

@injectable()
export class AnalysisService implements IAnalysisService {
    private _learningData: Map<string, CommandAnalysis>;

    constructor(
        @inject(TYPES.ProviderManager) private _providerManager: IProviderManager
    ) {
        this._learningData = new Map();
    }

    async analyzeCommand(command: string, context?: string): Promise<CommandAnalysis> {
        const provider = await this._providerManager.getDefaultProvider();
        const prompt = this._buildAnalysisPrompt(command, context);
        const response = await this._providerManager.processMessage('default', 'default', prompt);
        
        return this._parseAnalysisResponse(response);
    }

    async getSafetyScore(command: string): Promise<number> {
        const analysis = await this.analyzeCommand(command);
        return analysis.confidence * (analysis.isSafe ? 1 : -1);
    }

    async updateLearningContext(command: string, result: CommandAnalysis): Promise<void> {
        this._learningData.set(command, result);
        // In a real implementation, we'd persist this data
    }

    private _buildAnalysisPrompt(command: string, context?: string): string {
        return `Analyze the safety of this command: ${command}\n${context ? `Context: ${context}` : ''}`;
    }

    private _parseAnalysisResponse(response: any): CommandAnalysis {
        // Simple implementation for now
        return {
            isSafe: response.includes('safe'),
            confidence: 0.9,
            reasoning: response,
            safePatterns: [],
            unsafePatterns: [],
            suggestedAction: response.includes('safe') ? 'approve' : 'deny'
        };
    }
}
