export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum ErrorCategory {
    PROVIDER_OVERLOAD = 'provider_overload',
    NETWORK_ERROR = 'network_error',
    AUTHENTICATION = 'authentication',
    RATE_LIMIT = 'rate_limit',
    CONFIGURATION = 'configuration',
    UNKNOWN = 'unknown'
}

export interface SystemError {
    id: string;
    timestamp: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    context?: Record<string, any>;
    suggestedAction?: string;
}

export interface IErrorHandlingService {
    // Log and track errors
    logError(error: SystemError): Promise<void>;

    // Retrieve recent errors
    getRecentErrors(limit?: number): Promise<SystemError[]>;

    // Classify error severity
    classifyError(error: any): SystemError;

    // Automated error resolution
    resolveError(errorId: string): Promise<boolean>;

    // Error notification mechanism
    notifyErrorToUser(error: SystemError): void;

    // Telemetry and tracking
    trackErrorMetrics(error: SystemError): void;
}
