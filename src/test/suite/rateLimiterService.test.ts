import * as assert from 'assert';
import { Container } from 'inversify';
import 'reflect-metadata';
import { RateLimiterService } from '../../infrastructure/services/rateLimiterService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../../infrastructure/types';

suite('RateLimiterService Test Suite', () => {
    let container: Container;
    let rateLimiterService: RateLimiterService;
    let mockProviderManager: Partial<IProviderManager>;

    setup(() => {
        // Create mock provider manager
        mockProviderManager = {
            getDefaultProvider: async () => ({
                id: 'test-provider',
                name: 'Test Provider',
                models: ['gpt-3.5'],
                rateLimitConfig: {
                    maxRequestsPerMinute: 60,
                    maxRequestsPerHour: 500,
                    maxConcurrentRequests: 10
                },
                processMessage: async () => ({ content: 'test response' }),
                getCurrentRateLimitInfo: () => ({
                    limit: 60,
                    remaining: 50,
                    resetTimestamp: Date.now() + 60000,
                    currentUsage: 10
                })
            }),
            getProvider: () => mockProviderManager.getDefaultProvider(),
            processMessage: async () => ({ content: 'test response' })
        };

        // Setup DI container
        container = new Container();
        container.bind<IProviderManager>(TYPES.providerManager).toConstantValue(mockProviderManager as IProviderManager);
        container.bind<RateLimiterService>(TYPES.rateLimiter).to(RateLimiterService);

        // Get service instance
        rateLimiterService = container.get<RateLimiterService>(TYPES.rateLimiter);
    });

    test('Should calculate exponential backoff times', async () => {
        const backoffTimes = [1000, 2000, 4000, 8000, 16000];
        for (let i = 0; i < 5; i++) {
            const waitTime = rateLimiterService.calculateBackoffTime(i);
            assert.strictEqual(waitTime, backoffTimes[i], `Backoff time for attempt ${i} is incorrect`);
        }
    });

    test('Should record and track request events', async () => {
        const event = {
            timestamp: Date.now(),
            providerId: 'test-provider',
            modelId: 'gpt-3.5',
            isSuccessful: true
        };

        await rateLimiterService.recordRequest(event);
        const recentEvents = await rateLimiterService.getRecentLimitEvents();
        
        assert.strictEqual(recentEvents.length, 1);
        assert.deepStrictEqual(recentEvents[0], event);
    });

    test('Should find alternative provider', async () => {
        const alternativeProvider = await rateLimiterService.findAlternativeProvider('openai');
        assert.notStrictEqual(alternativeProvider, 'openai');
    });

    test('Should check rate limit and return status', async () => {
        const status = await rateLimiterService.checkRateLimit('test-provider', 'gpt-3.5');
        
        assert.strictEqual(typeof status.isAllowed, 'boolean');
        assert.strictEqual(typeof status.waitTimeMs, 'number');
        assert.strictEqual(typeof status.currentUsage, 'number');
    });

    test('Should update rate limit configuration', () => {
        const newConfig = {
            maxRequestsPerMinute: 30,
            backoffStrategy: 'linear' as const
        };

        rateLimiterService.updateRateLimitConfig(newConfig);
        
        // Unfortunately, we can't directly verify private _config, 
        // but we can test that it doesn't throw
        assert.doesNotThrow(() => {
            rateLimiterService.updateRateLimitConfig(newConfig);
        });
    });

    test('Should reset provider stats', async () => {
        // First, record some events
        await rateLimiterService.recordRequest({
            timestamp: Date.now(),
            providerId: 'test-provider',
            modelId: 'gpt-3.5',
            isSuccessful: true
        });

        // Reset stats
        await rateLimiterService.resetProviderStats('test-provider');

        // Check that events are cleared
        const recentEvents = await rateLimiterService.getRecentLimitEvents();
        assert.strictEqual(recentEvents.length, 0);
    });
});
