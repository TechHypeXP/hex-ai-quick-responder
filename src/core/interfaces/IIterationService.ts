export interface IterationContext {
    currentState: string;
    targetGoal: string;
    constraints: string[];
    previousDecisions?: string[];
}

export interface IterationAnalysis {
    assessment: string;
    risks: string[];
    opportunities: string[];
}

export interface IterationRecommendation {
    action: 'proceed' | 'stop' | 'modify';
    reasoning: string;
    mandateAlignment: boolean;
    confidence: number;
}

export interface IterationResult {
    phase: 'STOP' | 'THINK' | 'REITERATE';
    analysis: IterationAnalysis;
    recommendation: IterationRecommendation;
    nextSteps: string[];
}

export interface IIterationService {
    stop(context?: IterationContext): Promise<IterationResult>;
    think(context?: IterationContext): Promise<IterationResult>;
    reiterate(context?: IterationContext): Promise<IterationResult>;
    detectScopeCreep(context: IterationContext): Promise<boolean>;
}
