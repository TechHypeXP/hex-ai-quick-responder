import * as assert from 'assert';
import { OpenRouterApi } from '../../api/openRouterApi';
import sinon from 'sinon';
import * as vscode from 'vscode';
import { FetchStub, createMockResponse } from '../types';

interface MockHeaders {
    authorization?: string;
    httpReferer?: string;
    xTitle?: string;
    contentType?: string;
}

suite('OpenRouterApi Test Suite', () => {
    let api: OpenRouterApi;
    let fetchStub: FetchStub;
    let configStub: sinon.SinonStub;

    setup(() => {
        // Stub VSCode configuration
        configStub = sinon.stub(vscode.workspace, 'getConfiguration');
        configStub.returns({
            get: (key: string) => {
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
        fetchStub = sinon.stub() as FetchStub;
        (globalThis as any).fetch = fetchStub;
        
        api = new OpenRouterApi();
    });

    teardown(() => {
        sinon.restore();
        delete (globalThis as any).fetch;
    });

    test('processes messages with correct API parameters', async () => {
        fetchStub.resolves(createMockResponse(true, {
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
        const requestBody = JSON.parse(fetchCall.args[1]?.body as string);

        assert.strictEqual(requestBody.model, 'qwen/qwq-32b-preview');
        assert.strictEqual(requestBody.messages[1].content, 'test message');
        assert.strictEqual(requestBody.temperature, 0.7);
        assert.strictEqual(requestBody.maxTokens, 2000);
        assert.strictEqual(requestBody.topP, 0.9);
        assert.strictEqual(requestBody.frequencyPenalty, 0.5);
        assert.strictEqual(requestBody.presencePenalty, 0.3);
    });

    test('handles API errors appropriately', async () => {
        fetchStub.resolves(createMockResponse(false, {
            error: { message: 'API Error' }
        }));

        await assert.rejects(
            api.processMessage('test message'),
            /API Error/
        );
    });

    test('includes correct headers in API requests', async () => {
        fetchStub.resolves(createMockResponse(true, {
            choices: [{ message: { content: 'response' } }],
            usage: { totalTokens: 10 }
        }));

        await api.processMessage('test message');

        const headers = fetchStub.getCall(0).args[1]?.headers as MockHeaders;
        assert.strictEqual(headers?.authorization, 'Bearer test-api-key');
        assert.strictEqual(headers?.httpReferer, 'vscode-hex-quick-responder');
        assert.strictEqual(headers?.xTitle, 'Hex Quick Responder');
    });

    test('calculates cost correctly', async () => {
        fetchStub.resolves(createMockResponse(true, {
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

        await assert.rejects(
            api.processMessage('test message'),
            /API key not configured/
        );
    });

    test('handles empty API response', async () => {
        fetchStub.resolves(createMockResponse(true, {
            choices: []
        }));

        const response = await api.processMessage('test message');
        assert.strictEqual(response.content, 'No response generated');
    });

    test('includes system prompt with three iterations methodology', async () => {
        fetchStub.resolves(createMockResponse(true, {
            choices: [{ message: { content: 'response' } }]
        }));

        await api.processMessage('test message');

        const requestBody = JSON.parse(fetchStub.getCall(0).args[1]?.body as string);
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
                return createMockResponse(false, {
                    error: { message: 'rate limit exceeded' }
                });
            }
            return createMockResponse(true, {
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

        await assert.rejects(
            api.processMessage('test message'),
            /Network error/
        );
    });

    test('handles malformed API responses', async () => {
        fetchStub.resolves(createMockResponse(true, {
            malformed: 'response'
        }));

        const response = await api.processMessage('test message');
        assert.strictEqual(response.content, 'No response generated');
    });
});
