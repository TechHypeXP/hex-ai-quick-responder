import { CommandAnalysis, CommandConfig } from '../../types';

export interface ICommandService {
    analyzeCommand(command: string, args: string[], cwd: string): Promise<CommandAnalysis>;
    registerSafeCommand(command: string): Promise<void>;
    isCommandSafe(command: string, args: string[]): Promise<boolean>;
}
