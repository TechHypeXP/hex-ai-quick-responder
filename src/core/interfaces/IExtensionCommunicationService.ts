import * as vscode from 'vscode';

export interface ExtensionMessage {
    type: 'request' | 'response' | 'error' | 'capability';
    source: string;
    target?: string;
    payload: any;
    timestamp: number;
}

export interface ExtensionCapability {
    id: string;
    name: string;
    description: string;
    supportedActions: string[];
    version: string;
}

export interface IExtensionCommunicationService {
    // Core Communication Methods
    broadcast(message: ExtensionMessage): Promise<void>;
    sendDirectMessage(message: ExtensionMessage): Promise<any>;
    
    // Extension Discovery and Interaction
    discoverCompatibleExtensions(): Promise<ExtensionCapability[]>;
    registerCapabilities(capabilities: ExtensionCapability[]): Promise<void>;
    
    // Interaction Protocols
    requestCollaboration(
        targetExtension: string, 
        action: string, 
        context: any
    ): Promise<any>;
    
    // Event Handling
    onMessageReceived(callback: (message: ExtensionMessage) => void): vscode.Disposable;
    
    // Compatibility and Validation
    validateExtensionCompatibility(
        sourceExtension: string, 
        targetExtension: string
    ): Promise<boolean>;
    
    // Error Handling and Logging
    logInteractionEvent(event: {
        type: 'success' | 'failure' | 'warning';
        sourceExtension: string;
        targetExtension: string;
        action: string;
        details?: any;
    }): Promise<void>;
}

// Known Collaborative Extensions
export const KNOWN_COLLABORATIVE_EXTENSIONS = [
    {
        id: 'cursorAI',
        name: 'Cursor AI',
        supportedActions: ['code-completion', 'refactoring', 'explanation']
    },
    {
        id: 'githubCopilot',
        name: 'GitHub Copilot',
        supportedActions: ['code-suggestion', 'inline-completion']
    },
    {
        id: 'tabnine',
        name: 'Tabnine',
        supportedActions: ['ai-autocomplete', 'code-generation']
    }
];
