export interface RiskProfile {
    sensitivityLevel: 'low' | 'medium' | 'high';
    protectedResources: string[];
    restrictedOperations: string[];
}

export interface SafetyAssessment {
    isApproved: boolean;
    riskLevel: 'safe' | 'caution' | 'high-risk';
    violations: string[];
    recommendedActions?: string[];
}

export interface CodeModificationContext {
    fileType: string;
    language: string;
    projectRoot: string;
    currentContent: string;
    proposedChanges: string;
}

export interface ISafetyFilterService {
    // Core safety assessment methods
    assessCodeModification(
        context: CodeModificationContext
    ): Promise<SafetyAssessment>;

    // Risk profile management
    configureRiskProfile(
        profile: Partial<RiskProfile>
    ): Promise<void>;

    // Learning and adaptation
    recordSafetyOutcome(
        assessment: SafetyAssessment,
        actualOutcome: boolean
    ): Promise<void>;

    // Sensitive information detection
    detectSensitiveContent(
        content: string
    ): Promise<{
        containsSensitiveInfo: boolean;
        detectedSensitiveElements: string[];
    }>;

    // Preventive checks
    isOperationPermitted(
        operation: string,
        context?: any
    ): Promise<boolean>;
}

// Predefined risk categories
export const RISK_CATEGORIES = {
    DESTRUCTIVE_OPERATIONS: [
        'delete', 'remove', 'rm', 'destroy', 
        'force', 'override', 'reset'
    ],
    SENSITIVE_FILES: [
        '.env', 'credentials', 'config', 
        'secret', 'key', 'token'
    ],
    CRITICAL_DIRECTORIES: [
        'node_modules', '.git', 
        'vendor', 'bin', 'build'
    ]
};
