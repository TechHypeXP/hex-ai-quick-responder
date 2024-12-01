import { injectable } from 'inversify';
import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { 
    IErrorHandlingService, 
    SystemError, 
    ErrorSeverity, 
    ErrorCategory 
} from '../../core/interfaces/IErrorHandlingService';

@injectable()
export class ErrorHandlingService implements IErrorHandlingService {
    private _errorLog: SystemError[] = [];
    private _maxErrorLogSize = 100;

    async logError(error: SystemError): Promise<void> {
        // Manage error log size
        if (this._errorLog.length >= this._maxErrorLogSize) {
            this._errorLog.shift(); // Remove oldest error
        }
        
        this._errorLog.push(error);
        this.trackErrorMetrics(error);
        this.notifyErrorToUser(error);
    }

    async getRecentErrors(limit: number = 10): Promise<SystemError[]> {
        return this._errorLog.slice(-limit);
    }

    classifyError(error: any): SystemError {
        // Intelligent error classification
        const baseError: SystemError = {
            id: uuidv4(),
            timestamp: Date.now(),
            category: ErrorCategory.UNKNOWN,
            severity: ErrorSeverity.LOW,
            message: error.message || 'Unknown error occurred'
        };

        // Specific error type detection
        if (error.type === 'overloaded_error') {
            return {
                ...baseError,
                category: ErrorCategory.PROVIDER_OVERLOAD,
                severity: ErrorSeverity.HIGH,
                suggestedAction: 'Switch to alternative provider or retry later'
            };
        }

        if (error.name === 'NetworkError') {
            return {
                ...baseError,
                category: ErrorCategory.NETWORK_ERROR,
                severity: ErrorSeverity.MEDIUM,
                suggestedAction: 'Check network connection'
            };
        }

        return baseError;
    }

    async resolveError(errorId: string): Promise<boolean> {
        const errorIndex = this._errorLog.findIndex(err => err.id === errorId);
        
        if (errorIndex !== -1) {
            // Potential automated resolution strategies
            const error = this._errorLog[errorIndex];
            
            switch (error.category) {
                case ErrorCategory.PROVIDER_OVERLOAD:
                    // Trigger provider switch
                    return true;
                case ErrorCategory.NETWORK_ERROR:
                    // Attempt reconnection
                    return true;
                default:
                    return false;
            }
        }

        return false;
    }

    notifyErrorToUser(error: SystemError): void {
        // VS Code notification with context-aware messaging
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                vscode.window.showErrorMessage(
                    `Critical Error: ${error.message}. ${error.suggestedAction || ''}`
                );
                break;
            case ErrorSeverity.HIGH:
                vscode.window.showWarningMessage(
                    `High Severity Issue: ${error.message}. ${error.suggestedAction || ''}`
                );
                break;
            default:
                vscode.window.showInformationMessage(
                    `Notification: ${error.message}`
                );
        }
    }

    trackErrorMetrics(error: SystemError): void {
        // Placeholder for more advanced telemetry
        console.log('Error Tracked:', {
            category: error.category,
            severity: error.severity,
            timestamp: new Date(error.timestamp).toISOString()
        });

        // Future: Send to telemetry service
    }
}
