import * as assert from 'assert';
import { ProviderManager } from '../../api/providers/providerManager';
import sinon from 'sinon';
import { FetchStub, createMockResponse } from '../types';

suite('ProviderManager Integration Test Suite', () => {
    let providerManager: ProviderManager;
    let fetchStub: FetchStub;
    const clock = sinon.useFakeTimers();

    setup(() => {
        providerManager = ProviderManager.getInstance();
        // Stub fetch
        fetchStub = sinon.stub() as FetchStub;
        (globalThis as any).fetch = fetchStub;
    });

    teardown(() => {
        clock.restore();
        sinon.restore();
        delete (globalThis as any).fetch;
    });

    test('successful API call with rate limiting', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';

        // Mock successful API response
        fetchStub.resolves(createMockResponse(true, {
            choices: [{ message: { content: 'test response' } }],
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30
            }
        }));

        const response = await providerManager.processMessage(providerId, modelId, message);
        
        assert.strictEqual(response.content, 'test response');
        assert.strictEqual(response.usage?.totalTokens, 30);
    });

    test('handles rate limit errors with backoff', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';

        // Mock rate limit error response
        fetchStub.resolves(createMockResponse(false, {
            error: { message: 'rate limit exceeded' }
        }));

        // First call should throw and trigger rate limiting
        await assert.rejects(
            providerManager.processMessage(providerId, modelId, message),
            /rate limit exceeded/
        );

        // Second call should wait for backoff
        const startTime = Date.now();
        try {
            await providerManager.processMessage(providerId, modelId, message);
        } catch (error) {
            const endTime = Date.now();
            assert.ok(endTime - startTime >= 30000); // Minimum backoff
        }
    });

    test('recovers from rate limiting after success', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';

        // First call fails with rate limit
        fetchStub.onFirstCall().resolves(createMockResponse(false, {
            error: { message: 'rate limit exceeded' }
        }));

        // Subsequent calls succeed
        fetchStub.resolves(createMockResponse(true, {
            choices: [{ message: { content: 'success' } }],
            usage: { totalTokens: 10 }
        }));

        // First call triggers rate limiting
        await assert.rejects(
            providerManager.processMessage(providerId, modelId, message)
        );

        // Advance time past cooldown
        clock.tick(300001);

        // Should succeed and reset rate limiting
        const response = await providerManager.processMessage(providerId, modelId, message);
        assert.strictEqual(response.content, 'success');

        const status = providerManager.getProviderStatus(providerId);
        assert.strictEqual(status.isInCooldown, false);
    });

    test('handles multiple providers independently', async () => {
        const providers = ['openrouter', 'together'];
        const modelId = 'test-model';
        const message = 'test message';

        // Set up different rate limit states for each provider
        for (const providerId of providers) {
            fetchStub.withArgs(sinon.match(url => url.includes(providerId))).resolves(
                createMockResponse(false, {
                    error: { message: 'rate limit exceeded' }
                })
            );

            await assert.rejects(
                providerManager.processMessage(providerId, modelId, message)
            );
        }

        // Each provider should have its own rate limit state
        const states = providers.map(p => providerManager.getProviderStatus(p));
        assert.notStrictEqual(states[0].currentBackoff, states[1].currentBackoff);
    });

    test('cost calculation accuracy', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';

        fetchStub.resolves(createMockResponse(true, {
            choices: [{ message: { content: 'response' } }],
            usage: {
                promptTokens: 100,
                completionTokens: 100,
                totalTokens: 200
            }
        }));

        const response = await providerManager.processMessage(providerId, modelId, message);
        
        // Cost should be calculated correctly (200 tokens * 0.0015 per 1k tokens)
        const expectedCost = (200 / 1000) * 0.0015;
        assert.strictEqual(response.usage?.estimatedCost, expectedCost);
    });

    test('provider configuration management', () => {
        const customProvider = {
            id: 'custom',
            name: 'Custom Provider',
            baseUrl: 'https://api.custom.com',
            headerTemplate: {
                customHeader: 'value'
            },
            models: [{
                id: 'model-1',
                name: 'Model 1',
                contextLength: 4096,
                costPer1kTokens: 0.001
            }],
            defaultModel: 'model-1'
        };

        providerManager.addCustomProvider(customProvider);
        
        const provider = providerManager.getProvider('custom');
        assert.deepStrictEqual(provider, customProvider);
        
        const models = providerManager.getModels('custom');
        assert.deepStrictEqual(models, ['model-1']);
    });

    test('handles provider not found', async () => {
        await assert.rejects(
            providerManager.processMessage('nonexistent', 'model', 'message'),
            /Provider nonexistent not found/
        );
    });

    test('handles model not found', async () => {
        await assert.rejects(
            providerManager.processMessage('openrouter', 'nonexistent', 'message'),
            /Model nonexistent not found/
        );
    });
});
