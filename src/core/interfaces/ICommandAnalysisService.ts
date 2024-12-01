export interface CommandContext {
    // Contextual information about the current coding environment
    language: string;
    fileType: string;
    currentSelection?: string;
    entireFileContent?: string;
    cursorPosition: {
        line: number;
        character: number;
    };
    projectRoot?: string;
}

export interface AnalysisResult {
    // Detailed analysis of the command or context
    intent: string;
    complexity: 'low' | 'medium' | 'high';
    potentialActions: string[];
    confidenceScore: number;
    debugInfo?: any;
}

export interface SafetyAssessment {
    // Safety and risk evaluation
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    potentialIssues: string[];
    recommendedActions?: string[];
}

export interface ICommandAnalysisService {
    // Core analysis methods
    analyzeCommand(
        command: string, 
        context: CommandContext
    ): Promise<AnalysisResult>;

    // Safety and risk assessment
    assessSafety(
        command: string, 
        context: CommandContext
    ): Promise<SafetyAssessment>;

    // Learning and adaptation
    recordCommandOutcome(
        command: string, 
        context: CommandContext, 
        outcome: {
            success: boolean;
            details?: any;
        }
    ): Promise<void>;

    // Predictive and suggestive capabilities
    suggestAlternatives(
        command: string, 
        context: CommandContext
    ): Promise<string[]>;

    // Debugging and introspection
    getCommandHistory(
        options?: {
            limit?: number;
            filterLanguage?: string;
        }
    ): Promise<Array<{
        command: string;
        context: CommandContext;
        timestamp: number;
        outcome: any;
    }>>;
}

// Predefined command categories for initial classification
export const COMMAND_CATEGORIES = {
    REFACTORING: ['refactor', 'rename', 'extract'],
    CODE_GENERATION: ['generate', 'create', 'scaffold'],
    CODE_COMPLETION: ['complete', 'suggest'],
    DEBUGGING: ['debug', 'fix', 'diagnose'],
    DOCUMENTATION: ['document', 'explain', 'comment'],
    OPTIMIZATION: ['optimize', 'improve', 'performance']
};
