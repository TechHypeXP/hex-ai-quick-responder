import * as vscode from 'vscode';
import { injectable } from 'inversify';
import { 
    IExtensionCommunicationService, 
    ExtensionMessage, 
    ExtensionCapability,
    KNOWN_COLLABORATIVE_EXTENSIONS
} from '../../core/interfaces/IExtensionCommunicationService';

@injectable()
export class ExtensionCommunicationService implements IExtensionCommunicationService {
    private _messageEmitter = new vscode.EventEmitter<ExtensionMessage>();
    private _registeredCapabilities: Map<string, ExtensionCapability> = new Map();
    private _interactionLog: any[] = [];

    constructor() {
        // Initialize with known collaborative extensions
        KNOWN_COLLABORATIVE_EXTENSIONS.forEach(ext => 
            this._registeredCapabilities.set(ext.id, ext)
        );
    }

    async broadcast(message: ExtensionMessage): Promise<void> {
        // Broadcast message to all compatible extensions
        const compatibleExtensions = await this.discoverCompatibleExtensions();
        
        compatibleExtensions.forEach(ext => {
            try {
                // Simulate message sending (replace with actual VS Code extension messaging)
                this._messageEmitter.fire({
                    ...message,
                    target: ext.id
                });
                
                this.logInteractionEvent({
                    type: 'success',
                    sourceExtension: message.source,
                    targetExtension: ext.id,
                    action: message.type,
                    details: message.payload
                });
            } catch (error) {
                this.logInteractionEvent({
                    type: 'failure',
                    sourceExtension: message.source,
                    targetExtension: ext.id,
                    action: message.type,
                    details: error
                });
            }
        });
    }

    async sendDirectMessage(message: ExtensionMessage): Promise<any> {
        if (!message.target) {
            throw new Error('Target extension must be specified for direct messaging');
        }

        // Validate extension compatibility
        const isCompatible = await this.validateExtensionCompatibility(
            message.source, 
            message.target
        );

        if (!isCompatible) {
            throw new Error(`Incompatible extensions: ${message.source} and ${message.target}`);
        }

        // Simulate direct message (replace with actual VS Code extension messaging)
        return new Promise((resolve, reject) => {
            try {
                this._messageEmitter.fire(message);
                
                this.logInteractionEvent({
                    type: 'success',
                    sourceExtension: message.source,
                    targetExtension: message.target,
                    action: message.type,
                    details: message.payload
                });

                resolve({
                    status: 'sent',
                    timestamp: Date.now()
                });
            } catch (error) {
                this.logInteractionEvent({
                    type: 'failure',
                    sourceExtension: message.source,
                    targetExtension: message.target,
                    action: message.type,
                    details: error
                });
                reject(error);
            }
        });
    }

    async discoverCompatibleExtensions(): Promise<ExtensionCapability[]> {
        // In a real implementation, this would query VS Code for installed extensions
        return Array.from(this._registeredCapabilities.values());
    }

    async registerCapabilities(capabilities: ExtensionCapability[]): Promise<void> {
        capabilities.forEach(capability => {
            this._registeredCapabilities.set(capability.id, capability);
        });
    }

    async requestCollaboration(
        targetExtension: string, 
        action: string, 
        context: any
    ): Promise<any> {
        const message: ExtensionMessage = {
            type: 'request',
            source: 'hex-ai-quick-responder',
            target: targetExtension,
            payload: {
                action,
                context
            },
            timestamp: Date.now()
        };

        return this.sendDirectMessage(message);
    }

    onMessageReceived(callback: (message: ExtensionMessage) => void): vscode.Disposable {
        return this._messageEmitter.event(callback);
    }

    async validateExtensionCompatibility(
        sourceExtension: string, 
        targetExtension: string
    ): Promise<boolean> {
        const sourceCapability = this._registeredCapabilities.get(sourceExtension);
        const targetCapability = this._registeredCapabilities.get(targetExtension);

        if (!sourceCapability || !targetCapability) {
            return false;
        }

        // Basic compatibility check
        // Can be expanded with more sophisticated logic
        return true;
    }

    async logInteractionEvent(event: {
        type: 'success' | 'failure' | 'warning';
        sourceExtension: string;
        targetExtension: string;
        action: string;
        details?: any;
    }): Promise<void> {
        this._interactionLog.push({
            ...event,
            timestamp: Date.now()
        });

        // Optional: Persist logs or send to telemetry
        if (event.type !== 'success') {
            console.warn('Extension Interaction Event:', event);
        }
    }

    // Utility method to retrieve interaction logs
    getInteractionLogs(filter?: Partial<{
        type: 'success' | 'failure' | 'warning';
        sourceExtension: string;
        targetExtension: string;
    }>): any[] {
        if (!filter) return this._interactionLog;

        return this._interactionLog.filter(log => 
            (!filter.type || log.type === filter.type) &&
            (!filter.sourceExtension || log.sourceExtension === filter.sourceExtension) &&
            (!filter.targetExtension || log.targetExtension === filter.targetExtension)
        );
    }
}
