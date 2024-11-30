"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const providerManager_1 = require("../../api/providers/providerManager");
const sinon_1 = __importDefault(require("sinon"));
const types_1 = require("../types");
suite('ProviderManager Integration Test Suite', () => {
    let providerManager;
    let fetchStub;
    const clock = sinon_1.default.useFakeTimers();
    setup(() => {
        providerManager = providerManager_1.ProviderManager.getInstance();
        // Stub fetch to control API responses
        fetchStub = sinon_1.default.stub(globalThis, 'fetch');
    });
    teardown(() => {
        clock.restore();
        fetchStub.restore();
        sinon_1.default.restore();
    });
    test('successful API call with rate limiting', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';
        // Mock successful API response
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
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
        fetchStub.resolves((0, types_1.createMockResponse)(false, {
            error: { message: 'rate limit exceeded' }
        }));
        // First call should throw and trigger rate limiting
        await assert.rejects(providerManager.processMessage(providerId, modelId, message), /rate limit exceeded/);
        // Second call should wait for backoff
        const startTime = Date.now();
        try {
            await providerManager.processMessage(providerId, modelId, message);
        }
        catch (error) {
            const endTime = Date.now();
            assert.ok(endTime - startTime >= 30000); // Minimum backoff
        }
    });
    test('recovers from rate limiting after success', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';
        // First call fails with rate limit
        fetchStub.onFirstCall().resolves((0, types_1.createMockResponse)(false, {
            error: { message: 'rate limit exceeded' }
        }));
        // Subsequent calls succeed
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: [{ message: { content: 'success' } }],
            usage: { totalTokens: 10 }
        }));
        // First call triggers rate limiting
        await assert.rejects(providerManager.processMessage(providerId, modelId, message));
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
            fetchStub.withArgs(sinon_1.default.match(url => url.includes(providerId))).resolves((0, types_1.createMockResponse)(false, {
                error: { message: 'rate limit exceeded' }
            }));
            await assert.rejects(providerManager.processMessage(providerId, modelId, message));
        }
        // Each provider should have its own rate limit state
        const states = providers.map(p => providerManager.getProviderStatus(p));
        assert.notStrictEqual(states[0].currentBackoff, states[1].currentBackoff);
    });
    test('cost calculation accuracy', async () => {
        const providerId = 'openrouter';
        const modelId = 'qwen/qwq-32b-preview';
        const message = 'test message';
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
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
        await assert.rejects(providerManager.processMessage('nonexistent', 'model', 'message'), /Provider nonexistent not found/);
    });
    test('handles model not found', async () => {
        await assert.rejects(providerManager.processMessage('openrouter', 'nonexistent', 'message'), /Model nonexistent not found/);
    });
});
//# sourceMappingURL=providerManager.test.js.map