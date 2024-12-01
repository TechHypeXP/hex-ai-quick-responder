import * as assert from 'assert';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../../infrastructure/types';
import { CommandService } from '../../infrastructure/services/commandService';
import { IAnalysisService } from '../../core/interfaces/IAnalysisService';
import { IIterationService } from '../../core/interfaces/IIterationService';
import { IRagService } from '../../core/interfaces/IRagService';
import { CommandAnalysis } from '../../types';

suite('CommandService Test Suite', () => {
    let container: Container;
    let commandService: CommandService;
    let mockAnalysisService: Partial<IAnalysisService>;
    let mockIterationService: Partial<IIterationService>;
    let mockRagService: Partial<IRagService>;

    setup(() => {
        // Create mocks
        mockAnalysisService = {
            analyzeCommand: async (commandKey: string) => ({
                isSafe: commandKey.startsWith('npm'),
                confidence: 0.9,
                reasoning: 'Test reasoning',
                safePatterns: [],
                unsafePatterns: [],
                suggestedAction: 'approve'
            }),
            getSafetyScore: async () => 0.9,
            updateLearningContext: async () => {}
        };

        mockIterationService = {
            stop: async () => ({
                phase: 'STOP',
                analysis: {
                    assessment: 'Test assessment',
                    risks: [],
                    opportunities: []
                },
                recommendation: {
                    action: 'proceed',
                    reasoning: 'Test reasoning',
                    mandateAlignment: true,
                    confidence: 0.9
                },
                nextSteps: []
            }),
            think: async () => ({
                phase: 'THINK',
                analysis: {
                    assessment: 'Test assessment',
                    risks: [],
                    opportunities: []
                },
                recommendation: {
                    action: 'proceed',
                    reasoning: 'Test reasoning',
                    mandateAlignment: true,
                    confidence: 0.9
                },
                nextSteps: []
            }),
            reiterate: async () => ({
                phase: 'REITERATE',
                analysis: {
                    assessment: 'Test assessment',
                    risks: [],
                    opportunities: []
                },
                recommendation: {
                    action: 'proceed',
                    reasoning: 'Test reasoning',
                    mandateAlignment: true,
                    confidence: 0.9
                },
                nextSteps: []
            }),
            detectScopeCreep: async () => false
        };

        mockRagService = {
            getRelevantContext: async () => 'Test context',
            updateContext: async () => {}
        };

        // Setup DI container
        container = new Container();
        container.bind<IAnalysisService>(TYPES.AnalysisService).toConstantValue(mockAnalysisService as IAnalysisService);
        container.bind<IIterationService>(TYPES.IterationService).toConstantValue(mockIterationService as IIterationService);
        container.bind<IRagService>(TYPES.RagService).toConstantValue(mockRagService as IRagService);
        container.bind<CommandService>(TYPES.CommandService).to(CommandService);

        // Get service instance
        commandService = container.get<CommandService>(TYPES.CommandService);
    });

    test('Should approve safe npm command', async () => {
        const result = await commandService.analyzeCommand('npm', ['install'], '/project');
        assert.strictEqual(result.isSafe, true);
        assert.strictEqual(result.confidence >= 0.8, true);
    });

    test('Should deny unsafe rm command', async () => {
        const result = await commandService.analyzeCommand('rm', ['-rf', '/'], '/');
        assert.strictEqual(result.isSafe, false);
    });

    test('Should use historical context for repeated commands', async () => {
        // First call
        await commandService.analyzeCommand('git', ['status'], '/repo');
        
        // Second call should use context
        const result = await commandService.analyzeCommand('git', ['status'], '/repo');
        assert.strictEqual(result.confidence >= 0.8, true);
    });

    test('Should detect mandate violations', async () => {
        // Override mock for this test
        mockIterationService.stop = async () => ({
            phase: 'STOP',
            analysis: {
                assessment: 'Test assessment',
                risks: [],
                opportunities: []
            },
            recommendation: {
                action: 'stop',
                reasoning: 'Mandate violation',
                mandateAlignment: false,
                confidence: 0.9
            },
            nextSteps: []
        });

        const result = await commandService.analyzeCommand('dangerous', ['command'], '/');
        assert.strictEqual(result.isSafe, false);
        assert.strictEqual(result.reasoning.includes('mandate'), true);
    });
});
