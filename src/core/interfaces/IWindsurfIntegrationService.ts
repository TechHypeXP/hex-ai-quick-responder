export interface WindsurfCommandContext {
    // Contextual information from Windsurf
    fileType: string;
    programmingLanguage: string;
    currentSelection?: string;
    entireFileContent?: string;
    cursorPosition: {
        line: number;
        character: number;
    };
    projectRoot?: string;
}

export interface WindsurfFeatureFlags {
    aiAssistEnabled: boolean;
    experimentalFeaturesEnabled: boolean;
    privacyMode: boolean;
}

export interface WindsurfIntegrationResponse {
    success: boolean;
    data?: any;
    error?: string;
    debugInfo?: any;
}

export interface IWindsurfIntegrationService {
    // Core Integration Methods
    initializeIntegration(): Promise<WindsurfIntegrationResponse>;
    
    // Context Retrieval
    getCurrentContext(): Promise<WindsurfCommandContext>;
    
    // Feature Management
    getFeatureFlags(): Promise<WindsurfFeatureFlags>;
    updateFeatureFlags(flags: Partial<WindsurfFeatureFlags>): Promise<WindsurfIntegrationResponse>;
    
    // Command Execution
    executeWindsurfCommand(
        command: string, 
        context: WindsurfCommandContext
    ): Promise<WindsurfIntegrationResponse>;
    
    // Feedback and Telemetry
    reportIntegrationEvent(
        eventType: 'success' | 'error' | 'warning',
        details: any
    ): Promise<void>;
    
    // Error Handling
    handleIntegrationError(error: Error): Promise<WindsurfIntegrationResponse>;
}

// Predefined Windsurf-specific Commands
export const WINDSURF_COMMANDS = {
    AI_ASSIST: 'windsurf.aiAssist',
    CODE_COMPLETE: 'windsurf.codeComplete',
    CONTEXT_ANALYZE: 'windsurf.contextAnalyze',
    REFACTOR_SUGGEST: 'windsurf.refactorSuggest',
    ERROR_DIAGNOSE: 'windsurf.errorDiagnose'
};
