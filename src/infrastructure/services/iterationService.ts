import { injectable, inject } from 'inversify';
import { IIterationService, IterationContext, IterationResult } from '../../core/interfaces/IIterationService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';

@injectable()
export class IterationService implements IIterationService {
    constructor(
        @inject(TYPES.ProviderManager) private _providerManager: IProviderManager
    ) {}

    async stop(context?: IterationContext): Promise<IterationResult> {
        const provider = await this._providerManager.getDefaultProvider();
        const prompt = this._buildStopPrompt(context);
        const response = await this._providerManager.processMessage('default', 'default', prompt);
        
        return {
            phase: 'STOP',
            analysis: {
                assessment: response || 'Initial assessment',
                risks: [],
                opportunities: []
            },
            recommendation: {
                action: 'proceed',
                reasoning: 'Basic check passed',
                mandateAlignment: true,
                confidence: 0.9
            },
            nextSteps: []
        };
    }

    async think(context?: IterationContext): Promise<IterationResult> {
        const provider = await this._providerManager.getDefaultProvider();
        const prompt = this._buildThinkPrompt(context);
        const response = await this._providerManager.processMessage('default', 'default', prompt);
        
        return {
            phase: 'THINK',
            analysis: {
                assessment: response || 'Detailed analysis',
                risks: [],
                opportunities: []
            },
            recommendation: {
                action: 'proceed',
                reasoning: 'Detailed analysis passed',
                mandateAlignment: true,
                confidence: 0.9
            },
            nextSteps: []
        };
    }

    async reiterate(context?: IterationContext): Promise<IterationResult> {
        const provider = await this._providerManager.getDefaultProvider();
        const prompt = this._buildReiteratePrompt(context);
        const response = await this._providerManager.processMessage('default', 'default', prompt);
        
        return {
            phase: 'REITERATE',
            analysis: {
                assessment: response || 'Final assessment',
                risks: [],
                opportunities: []
            },
            recommendation: {
                action: 'proceed',
                reasoning: 'Final check passed',
                mandateAlignment: true,
                confidence: 0.9
            },
            nextSteps: []
        };
    }

    async detectScopeCreep(context: IterationContext): Promise<boolean> {
        const currentGoal = context.targetGoal;
        const previousDecisions = context.previousDecisions || [];
        
        // Simple heuristic: if we have too many decisions or diverging goals
        return previousDecisions.length > 10 || 
               !previousDecisions.every(d => d.includes(currentGoal));
    }

    private _buildStopPrompt(context?: IterationContext): string {
        if (!context) {
            return 'Initial assessment phase';
        }
        return `Initial assessment phase:
Current State: ${context.currentState}
Target Goal: ${context.targetGoal}
Constraints: ${context.constraints.join(', ')}`;
    }

    private _buildThinkPrompt(context?: IterationContext): string {
        if (!context) {
            return 'Detailed analysis phase';
        }
        return `Detailed analysis phase:
Current State: ${context.currentState}
Target Goal: ${context.targetGoal}
Constraints: ${context.constraints.join(', ')}
Previous Decisions: ${context.previousDecisions?.join(', ')}`;
    }

    private _buildReiteratePrompt(context?: IterationContext): string {
        if (!context) {
            return 'Final assessment phase';
        }
        return `Final assessment phase:
Current State: ${context.currentState}
Target Goal: ${context.targetGoal}
Constraints: ${context.constraints.join(', ')}
Previous Decisions: ${context.previousDecisions?.join(', ')}`;
    }
}
