import { injectable, inject } from 'inversify';
import { 
    ISafetyFilterService, 
    SafetyAssessment, 
    CodeModificationContext,
    RiskProfile,
    RISK_CATEGORIES
} from '../../core/interfaces/ISafetyFilterService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';

@injectable()
export class SafetyFilterService implements ISafetyFilterService {
    // Configurable risk profile
    private _riskProfile: RiskProfile = {
        sensitivityLevel: 'medium',
        protectedResources: [
            ...RISK_CATEGORIES.SENSITIVE_FILES,
            ...RISK_CATEGORIES.CRITICAL_DIRECTORIES
        ],
        restrictedOperations: [
            ...RISK_CATEGORIES.DESTRUCTIVE_OPERATIONS
        ]
    };

    // Learning mechanism: track safety assessments
    private _safetyAssessmentHistory: SafetyAssessment[] = [];

    constructor(
        @inject(TYPES.providerManager) private _providerManager: IProviderManager
    ) {}

    async assessCodeModification(
        context: CodeModificationContext
    ): Promise<SafetyAssessment> {
        const violations: string[] = [];

        // Check for destructive operations
        const isDestructiveOperation = this._riskProfile.restrictedOperations.some(
            op => context.proposedChanges.toLowerCase().includes(op)
        );
        if (isDestructiveOperation) {
            violations.push('Potentially destructive operation detected');
        }

        // Sensitive file protection
        const isSensitiveFile = this._riskProfile.protectedResources.some(
            resource => context.fileType.toLowerCase().includes(resource)
        );
        if (isSensitiveFile) {
            violations.push('Modification of sensitive file attempted');
        }

        // AI-powered additional risk assessment
        try {
            const provider = await this._providerManager.selectBestProvider();
            const aiRiskAssessment = await this._providerManager.processMessage({
                message: `Assess risk in code modification: ${context.proposedChanges}`,
                context: { ...context, assessmentType: 'safety' }
            });

            // Hypothetical AI risk scoring
            if (aiRiskAssessment.content.includes('high-risk')) {
                violations.push('AI-detected high-risk modification');
            }
        } catch (error) {
            // Fallback if AI assessment fails
            console.warn('AI risk assessment failed', error);
        }

        // Determine risk level
        const riskLevel = violations.length === 0 
            ? 'safe' 
            : (violations.length <= 1 ? 'caution' : 'high-risk');

        const assessment: SafetyAssessment = {
            isApproved: riskLevel !== 'high-risk',
            riskLevel,
            violations,
            recommendedActions: violations.length > 0 
                ? ['Review changes carefully', 'Confirm intent'] 
                : undefined
        };

        // Record assessment for learning
        this._safetyAssessmentHistory.push(assessment);

        return assessment;
    }

    async configureRiskProfile(
        profile: Partial<RiskProfile>
    ): Promise<void> {
        this._riskProfile = {
            ...this._riskProfile,
            ...profile
        };
    }

    async recordSafetyOutcome(
        assessment: SafetyAssessment,
        actualOutcome: boolean
    ): Promise<void> {
        // Learning mechanism: adjust risk profile based on outcomes
        if (!actualOutcome && assessment.riskLevel !== 'high-risk') {
            // If a non-high-risk assessment led to a negative outcome
            // Increase sensitivity
            this._riskProfile.sensitivityLevel = 'high';
        }
    }

    async detectSensitiveContent(
        content: string
    ): Promise<{
        containsSensitiveInfo: boolean;
        detectedSensitiveElements: string[];
    }> {
        const sensitivePatterns = [
            /password\s*=\s*['"][^'"]+['"]/i,
            /secret\s*key\s*=\s*['"][^'"]+['"]/i,
            /api\s*key\s*=\s*['"][^'"]+['"]/i,
            /token\s*=\s*['"][^'"]+['"]/i
        ];

        const detectedElements = sensitivePatterns
            .map(pattern => content.match(pattern))
            .filter(match => match !== null)
            .map(match => match![0]);

        return {
            containsSensitiveInfo: detectedElements.length > 0,
            detectedSensitiveElements: detectedElements
        };
    }

    async isOperationPermitted(
        operation: string,
        context?: any
    ): Promise<boolean> {
        // Check against restricted operations
        const isRestricted = this._riskProfile.restrictedOperations.some(
            restrictedOp => operation.toLowerCase().includes(restrictedOp)
        );

        return !isRestricted;
    }
}
