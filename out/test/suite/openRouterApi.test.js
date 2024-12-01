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
const openRouterApi_1 = require("../../api/openRouterApi");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
suite('OpenRouterApi Test Suite', () => {
    let api;
    let fetchStub;
    let configStub;
    setup(() => {
        // Stub VSCode configuration
        configStub = sinon_1.default.stub(vscode.workspace, 'getConfiguration');
        configStub.returns({
            get: (key) => {
                switch (key) {
                    case 'openRouterApiKey':
                        return 'test-api-key';
                    case 'openRouterModel':
                        return 'qwen/qwq-32b-preview';
                    default:
                        return undefined;
                }
            }
        });
        // Stub fetch
        fetchStub = sinon_1.default.stub();
        globalThis.fetch = fetchStub;
        api = new openRouterApi_1.OpenRouterApi();
    });
    teardown(() => {
        sinon_1.default.restore();
        delete globalThis.fetch;
    });
    test('processes messages with correct API parameters', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: [{ message: { content: 'test response' } }],
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30
            }
        }));
        await api.processMessage('test message');
        // Verify API call parameters
        const fetchCall = fetchStub.getCall(0);
        const requestBody = JSON.parse(fetchCall.args[1]?.body);
        assert.strictEqual(requestBody.model, 'qwen/qwq-32b-preview');
        assert.strictEqual(requestBody.messages[1].content, 'test message');
        assert.strictEqual(requestBody.temperature, 0.7);
        assert.strictEqual(requestBody.maxTokens, 2000);
        assert.strictEqual(requestBody.topP, 0.9);
        assert.strictEqual(requestBody.frequencyPenalty, 0.5);
        assert.strictEqual(requestBody.presencePenalty, 0.3);
    });
    test('handles API errors appropriately', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(false, {
            error: { message: 'API Error' }
        }));
        await assert.rejects(api.processMessage('test message'), /API Error/);
    });
    test('includes correct headers in API requests', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: [{ message: { content: 'response' } }],
            usage: { totalTokens: 10 }
        }));
        await api.processMessage('test message');
        const headers = fetchStub.getCall(0).args[1]?.headers;
        assert.strictEqual(headers?.authorization, 'Bearer test-api-key');
        assert.strictEqual(headers?.httpReferer, 'vscode-hex-quick-responder');
        assert.strictEqual(headers?.xTitle, 'Hex Quick Responder');
    });
    test('calculates cost correctly', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: [{ message: { content: 'response' } }],
            usage: {
                promptTokens: 150,
                completionTokens: 50,
                totalTokens: 200
            }
        }));
        const response = await api.processMessage('test message');
        // 200 tokens * 0.0015 per 1k tokens
        const expectedCost = (200 / 1000) * 0.0015;
        assert.strictEqual(response.usage?.estimatedCost, expectedCost);
    });
    test('handles missing API key', async () => {
        configStub.returns({
            get: () => undefined
        });
        await assert.rejects(api.processMessage('test message'), /API key not configured/);
    });
    test('handles empty API response', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: []
        }));
        const response = await api.processMessage('test message');
        assert.strictEqual(response.content, 'No response generated');
    });
    test('includes system prompt with three iterations methodology', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            choices: [{ message: { content: 'response' } }]
        }));
        await api.processMessage('test message');
        const requestBody = JSON.parse(fetchStub.getCall(0).args[1]?.body);
        const systemPrompt = requestBody.messages[0].content;
        assert.ok(systemPrompt.includes('three iterations methodology'));
        assert.ok(systemPrompt.includes('Understand the core problem'));
        assert.ok(systemPrompt.includes('Break it down'));
        assert.ok(systemPrompt.includes('Execute with precise direction'));
    });
    test('retries failed requests with exponential backoff', async () => {
        let attempts = 0;
        fetchStub.callsFake(async () => {
            attempts++;
            if (attempts < 3) {
                return (0, types_1.createMockResponse)(false, {
                    error: { message: 'rate limit exceeded' }
                });
            }
            return (0, types_1.createMockResponse)(true, {
                choices: [{ message: { content: 'success' } }],
                usage: { totalTokens: 10 }
            });
        });
        const response = await api.processMessage('test message');
        assert.strictEqual(response.content, 'success');
        assert.strictEqual(attempts, 3);
    });
    test('handles network errors', async () => {
        fetchStub.rejects(new Error('Network error'));
        await assert.rejects(api.processMessage('test message'), /Network error/);
    });
    test('handles malformed API responses', async () => {
        fetchStub.resolves((0, types_1.createMockResponse)(true, {
            malformed: 'response'
        }));
        const response = await api.processMessage('test message');
        assert.strictEqual(response.content, 'No response generated');
    });
});
//# sourceMappingURL=openRouterApi.test.js.map