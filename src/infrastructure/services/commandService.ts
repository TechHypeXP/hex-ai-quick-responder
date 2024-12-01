import { ICommandService } from '../../core/interfaces/ICommandService';
import { IAnalysisService } from '../../core/interfaces/IAnalysisService';
import { IIterationService, IterationContext } from '../../core/interfaces/IIterationService';
import { IRagService } from '../../core/interfaces/IRagService';
import { CommandAnalysis } from '../../types';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';

@injectable()
export class CommandService implements ICommandService {
    private _safeCommands: Set<string>;

    constructor(
        @inject(TYPES.AnalysisService) private _analysisService: IAnalysisService,
        @inject(TYPES.IterationService) private _iterationService: IIterationService,
        @inject(TYPES.RagService) private _ragService: IRagService
    ) {
        this._safeCommands = new Set();
    }

    async analyzeCommand(command: string, args: string[], cwd: string): Promise<CommandAnalysis> {
        const commandKey = `${command} ${args.join(' ')}`;
        
        // Get historical context
        const context = await this._ragService.getRelevantContext(commandKey);
        
        // Initial safety check
        const safetyAnalysis = await this._analysisService.analyzeCommand(commandKey, context);
        
        // If clearly unsafe, return immediately
        if (!safetyAnalysis.isSafe && safetyAnalysis.confidence > 0.9) {
            return safetyAnalysis;
        }

        // Run through iteration methodology
        const stopPhase = await this._iterationService.stop();
        if (stopPhase.recommendation.action === 'stop') {
            return {
                isSafe: false,
                confidence: stopPhase.recommendation.confidence,
                reasoning: stopPhase.recommendation.reasoning,
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: 'deny'
            };
        }

        const thinkPhase = await this._iterationService.think();
        if (!thinkPhase.recommendation.mandateAlignment) {
            return {
                isSafe: false,
                confidence: thinkPhase.recommendation.confidence,
                reasoning: 'Command violates mandate alignment',
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: 'deny'
            };
        }

        // Update learning context
        await this._ragService.updateContext(commandKey, {
            command,
            args,
            cwd,
            analysis: safetyAnalysis
        });

        return safetyAnalysis;
    }

    async registerSafeCommand(command: string): Promise<void> {
        this._safeCommands.add(command);
    }

    async isCommandSafe(command: string, args: string[]): Promise<boolean> {
        const fullCommand = `${command} ${args.join(' ')}`.trim();
        
        if (this._safeCommands.has(fullCommand)) {
            return true;
        }

        const safetyScore = await this._analysisService.getSafetyScore(fullCommand);
        return safetyScore > 0.8;
    }
}
