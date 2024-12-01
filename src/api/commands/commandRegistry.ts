import * as vscode from 'vscode';
import { CommandConfig } from './types';

export class CommandRegistry {
    private static _instance: CommandRegistry;
    private _commandConfigs: Map<string, CommandConfig>;

    private constructor() {
        this._commandConfigs = new Map();
        this._loadDefaultConfigs();
        this._loadCustomConfigs();
    }

    static getInstance(): CommandRegistry {
        if (!CommandRegistry._instance) {
            CommandRegistry._instance = new CommandRegistry();
        }
        return CommandRegistry._instance;
    }

    getCommandConfig(command: string): CommandConfig | undefined {
        return this._commandConfigs.get(command);
    }

    addCommandConfig(config: CommandConfig): void {
        this._commandConfigs.set(config.command, config);
        this._saveCustomConfigs();
    }

    addUnsafePattern(command: string, patterns: string[]): void {
        const config = this._commandConfigs.get(command);
        if (config) {
            config.unsafePatterns = [
                ...(config.unsafePatterns || []),
                ...patterns
            ];
            this._saveCustomConfigs();
        }
    }

    private _loadDefaultConfigs(): void {
        // Load built-in safe commands
        const defaultConfigs: CommandConfig[] = [
            {
                command: 'npm',
                autoApprove: true,
                safePatterns: [
                    'install',
                    'ci',
                    'test',
                    'run',
                    'start',
                    'build'
                ],
                unsafePatterns: [
                    'uninstall',
                    'remove',
                    'publish',
                    'deprecate'
                ]
            },
            {
                command: 'git',
                autoApprove: true,
                safePatterns: [
                    'pull',
                    'fetch',
                    'status',
                    'branch',
                    'checkout',
                    'log'
                ],
                unsafePatterns: [
                    'push.*--force',
                    'reset.*--hard',
                    'clean.*-[fd]'
                ]
            }
        ];

        defaultConfigs.forEach(config => {
            this._commandConfigs.set(config.command, config);
        });
    }

    private _loadCustomConfigs(): void {
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const customConfigs: CommandConfig[] = config.get('commandConfigs') || [];
        
        customConfigs.forEach(commandConfig => {
            this._commandConfigs.set(commandConfig.command, commandConfig);
        });
    }

    private async _saveCustomConfigs(): Promise<void> {
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const customConfigs = Array.from(this._commandConfigs.values())
            .filter(config => !config.isDefault);
        
        await config.update(
            'commandConfigs',
            customConfigs,
            vscode.ConfigurationTarget.Global
        );
    }
}
