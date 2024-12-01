import { CommandAnalysis } from '../../types';

export interface IAnalysisService {
    analyzeCommand(command: string, context?: string): Promise<CommandAnalysis>;
    getSafetyScore(command: string): Promise<number>;
    updateLearningContext(command: string, result: CommandAnalysis): Promise<void>;
}
