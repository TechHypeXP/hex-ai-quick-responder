import * as vscode from 'vscode';
import { injectable, inject } from 'inversify';
import { 
    IWindsurfIntegrationService, 
    WindsurfCommandContext, 
    WindsurfFeatureFlags, 
    WindsurfIntegrationResponse,
    WINDSURF_COMMANDS
} from '../../core/interfaces/IWindsurfIntegrationService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';

@injectable()
export class WindsurfIntegrationService implements IWindsurfIntegrationService {
    // Feature flags with default values
    private _featureFlags: WindsurfFeatureFlags = {
        aiAssistEnabled: true,
        experimentalFeaturesEnabled: false,
        privacyMode: false
    };

    // Integration state tracking
    private _integrationState = {
        isInitialized: false,
        lastInitializationAttempt: 0,
        failureCount: 0
    };

    constructor(
        @inject(TYPES.providerManager) private _providerManager: IProviderManager
    ) {}

    async initializeIntegration(): Promise<WindsurfIntegrationResponse> {
        try {
            // Check Windsurf extension availability
            const windsurfExtension = vscode.extensions.getExtension('windsurf.ide');
            if (!windsurfExtension) {
                throw new Error('Windsurf IDE extension not found');
            }

            // Validate extension
            await windsurfExtension.activate();

            this._integrationState = {
                isInitialized: true,
                lastInitializationAttempt: Date.now(),
                failureCount: 0
            };

            return {
                success: true,
                data: {
                    version: windsurfExtension.packageJSON.version,
                    activated: true
                }
            };
        } catch (error) {
            return this.handleIntegrationError(error as Error);
        }
    }

    async getCurrentContext(): Promise<WindsurfCommandContext> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active text editor');
        }

        return {
            fileType: editor.document.fileName.split('.').pop() || 'unknown',
            programmingLanguage: editor.document.languageId,
            currentSelection: editor.document.getText(editor.selection),
            entireFileContent: editor.document.getText(),
            cursorPosition: {
                line: editor.selection.active.line,
                character: editor.selection.active.character
            },
            projectRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        };
    }

    async getFeatureFlags(): Promise<WindsurfFeatureFlags> {
        return { ...this._featureFlags };
    }

    async updateFeatureFlags(flags: Partial<WindsurfFeatureFlags>): Promise<WindsurfIntegrationResponse> {
        this._featureFlags = { ...this._featureFlags, ...flags };
        
        return {
            success: true,
            data: this._featureFlags
        };
    }

    async executeWindsurfCommand(
        command: string, 
        context: WindsurfCommandContext
    ): Promise<WindsurfIntegrationResponse> {
        // Ensure initialization
        if (!this._integrationState.isInitialized) {
            await this.initializeIntegration();
        }

        // Check if AI assist is enabled
        if (!this._featureFlags.aiAssistEnabled) {
            return {
                success: false,
                error: 'AI Assist is currently disabled'
            };
        }

        try {
            // Select best provider for the command
            const provider = await this._providerManager.selectBestProvider({
                complexity: this.determineComplexity(context)
            });

            // Process message through provider
            const providerResponse = await this._providerManager.processMessage({
                message: `Execute Windsurf command: ${command}`,
                context: { ...context, command }
            });

            // Simulate Windsurf command execution
            const commandResult = await vscode.commands.executeCommand(
                WINDSURF_COMMANDS[command as keyof typeof WINDSURF_COMMANDS],
                { 
                    context, 
                    aiResponse: providerResponse 
                }
            );

            return {
                success: true,
                data: commandResult
            };
        } catch (error) {
            return this.handleIntegrationError(error as Error);
        }
    }

    async reportIntegrationEvent(
        eventType: 'success' | 'error' | 'warning',
        details: any
    ): Promise<void> {
        // In a real-world scenario, this would integrate with telemetry
        console.log(`Windsurf Integration Event [${eventType}]:`, details);
    }

    async handleIntegrationError(error: Error): Promise<WindsurfIntegrationResponse> {
        // Increment failure tracking
        this._integrationState.failureCount++;

        // Log the error
        this.reportIntegrationEvent('error', {
            message: error.message,
            stack: error.stack,
            failureCount: this._integrationState.failureCount
        });

        // Reset initialization if too many failures
        if (this._integrationState.failureCount > 3) {
            this._integrationState.isInitialized = false;
        }

        return {
            success: false,
            error: error.message,
            debugInfo: {
                failureCount: this._integrationState.failureCount
            }
        };
    }

    // Helper method to determine complexity
    private determineComplexity(context: WindsurfCommandContext): 'low' | 'medium' | 'high' {
        // Simple complexity estimation
        if (!context.currentSelection) return 'low';
        
        const selectionLength = context.currentSelection.length;
        if (selectionLength < 50) return 'low';
        if (selectionLength < 200) return 'medium';
        return 'high';
    }
}
