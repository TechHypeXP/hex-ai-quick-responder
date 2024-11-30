import * as assert from 'assert';
import * as vscode from 'vscode';
import sinon from 'sinon';
import { ProviderManager } from '../../api/providers/providerManager';
import { EventEmitter, Disposable } from 'vscode';

suite('Extension Test Suite', () => {
    let showQuickPickStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let configStub: sinon.SinonStub;
    const clock = sinon.useFakeTimers();

    setup(() => {
        // Stub VSCode UI interactions
        showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
        showInformationMessageStub = sinon.stub(vscode.window, 'showInformationMessage');

        // Stub configuration
        configStub = sinon.stub(vscode.workspace, 'getConfiguration');
        configStub.returns({
            get: (key: string) => {
                switch (key) {
                    case 'responses':
                        return {
                            'saveChanges': 'Yes',
                            'reloadWindow': 'Yes'
                        };
                    case 'autoRespond':
                        return true;
                    case 'useAi':
                        return true;
                    case 'selectedProvider':
                        return 'openrouter';
                    case 'openRouterApiKey':
                        return 'test-api-key';
                    default:
                        return undefined;
                }
            },
            update: sinon.stub()
        });
    });

    teardown(() => {
        sinon.restore();
        clock.restore();
    });

    test('extension activates successfully', async () => {
        const extension = vscode.extensions.getExtension('HexProperty.Hex-Quick-Responder');
        assert.ok(extension);
        
        await extension?.activate();
        assert.strictEqual(extension?.isActive, true);
    });

    test('handles predefined dialog responses', async () => {
        showQuickPickStub.resolves({
            label: 'saveChanges',
            description: 'Responds with: Yes'
        });

        await vscode.commands.executeCommand('hex-quick-responder.respond');

        assert.ok(showInformationMessageStub.calledWith(
            'saveChanges',
            { modal: true },
            'Yes'
        ));
    });

    test('handles AI-processed responses with rate limiting', async () => {
        // Mock unknown dialog
        showQuickPickStub.resolves({
            label: 'unknownQuestion',
            description: undefined
        });

        const providerManager = ProviderManager.getInstance();
        let callCount = 0;

        // Mock rate limited then successful responses
        const processMessageStub = sinon.stub(providerManager, 'processMessage')
            .callsFake(async () => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('rate limit exceeded');
                }
                return {
                    content: 'AI generated response',
                    usage: {
                        promptTokens: 10,
                        completionTokens: 20,
                        totalTokens: 30,
                        estimatedCost: 0.00045
                    }
                };
            });

        // First attempt should hit rate limit
        await vscode.commands.executeCommand('hex-quick-responder.respond');
        assert.ok(showInformationMessageStub.calledWith(
            'AI processing failed: Error: rate limit exceeded'
        ));

        // Advance time past backoff period
        clock.tick(30001);

        // Second attempt should succeed
        await vscode.commands.executeCommand('hex-quick-responder.respond');
        assert.ok(showInformationMessageStub.calledWith(
            'unknownQuestion',
            { modal: true },
            'AI generated response'
        ));

        assert.strictEqual(callCount, 2);
        processMessageStub.restore();
    });

    test('adds new response mapping', async () => {
        const inputStub = sinon.stub(vscode.window, 'showInputBox');
        inputStub.onFirstCall().resolves('newQuestion');
        inputStub.onSecondCall().resolves('newResponse');

        await vscode.commands.executeCommand('hex-quick-responder.addResponse');

        assert.ok(configStub().update.called);
        assert.ok(showInformationMessageStub.calledWith(
            'Hex Quick Responder: Added mapping "newQuestion" → "newResponse"'
        ));
    });

    test('adds custom provider with rate limiting support', async () => {
        const inputStub = sinon.stub(vscode.window, 'showInputBox');
        inputStub.resolves(JSON.stringify({
            id: 'custom',
            name: 'Custom Provider',
            baseUrl: 'https://api.custom.com',
            headerTemplate: {
                customHeader: 'value'
            },
            models: [{
                id: 'model1',
                name: 'Model 1',
                contextLength: 4096,
                costPer1kTokens: 0.001
            }],
            defaultModel: 'model1'
        }));

        await vscode.commands.executeCommand('hex-quick-responder.addProvider');

        // Verify provider was added
        const providerManager = ProviderManager.getInstance();
        const provider = providerManager.getProvider('custom');
        assert.ok(provider);
        assert.strictEqual(provider.name, 'Custom Provider');

        // Verify rate limiting is working for new provider
        const status = providerManager.getProviderStatus('custom');
        assert.ok(status);
        assert.strictEqual(status.isInCooldown, false);
    });

    test('handles window state changes with rate limiting', async () => {
        const windowStateEventEmitter = new EventEmitter<vscode.WindowState>();
        const disposable = new Disposable(() => {});
        
        sinon.stub(vscode.window, 'onDidChangeWindowState')
            .returns(Object.assign(windowStateEventEmitter.event, disposable));

        // Trigger window state change
        windowStateEventEmitter.fire({
            focused: true,
            active: true
        });

        // Should attempt to handle active dialog
        assert.ok(showQuickPickStub.called);
    });

    test('respects rate limits across multiple dialogs', async () => {
        const providerManager = ProviderManager.getInstance();
        let callCount = 0;

        // Mock rate limited responses
        const processMessageStub = sinon.stub(providerManager, 'processMessage')
            .callsFake(async () => {
                callCount++;
                throw new Error('rate limit exceeded');
            });

        showQuickPickStub.resolves({
            label: 'testQuestion',
            description: undefined
        });

        // Multiple rapid dialog requests
        for (let i = 0; i < 3; i++) {
            await vscode.commands.executeCommand('hex-quick-responder.respond');
        }

        // Should only make one attempt due to rate limiting
        assert.strictEqual(callCount, 1);

        // Advance time past backoff
        clock.tick(30001);

        // Should allow another attempt
        await vscode.commands.executeCommand('hex-quick-responder.respond');
        assert.strictEqual(callCount, 2);

        processMessageStub.restore();
    });

    test('handles configuration changes', async () => {
        const newResponses = {
            newDialog: 'Response'
        };

        // Update configuration
        await vscode.workspace.getConfiguration('hexQuickResponder')
            .update('responses', newResponses);

        showQuickPickStub.resolves({
            label: 'newDialog',
            description: 'Responds with: Response'
        });

        await vscode.commands.executeCommand('hex-quick-responder.respond');

        assert.ok(showInformationMessageStub.calledWith(
            'newDialog',
            { modal: true },
            'Response'
        ));
    });

    test('handles concurrent dialog requests', async () => {
        const providerManager = ProviderManager.getInstance();
        const processMessageStub = sinon.stub(providerManager, 'processMessage')
            .resolves({
                content: 'Response',
                usage: {
                    promptTokens: 5,
                    completionTokens: 5,
                    totalTokens: 10,
                    estimatedCost: 0.0001
                }
            });

        showQuickPickStub.resolves({
            label: 'concurrentTest',
            description: undefined
        });

        // Send multiple concurrent requests
        const requests = Promise.all([
            vscode.commands.executeCommand('hex-quick-responder.respond'),
            vscode.commands.executeCommand('hex-quick-responder.respond'),
            vscode.commands.executeCommand('hex-quick-responder.respond')
        ]);

        await assert.doesNotReject(requests);
        processMessageStub.restore();
    });
});
