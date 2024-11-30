import * as vscode from 'vscode';
import { ProviderManager } from './api/providers/providerManager';
import { ProviderConfig } from './api/providers/types';

interface ResponseMapping {
    [key: string]: string;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Hex Quick Responder is now active!');

    // Initialize Provider Manager
    const providerManager = ProviderManager.getInstance();

    // Monitor window state changes to auto-respond to dialogs
    const windowStateDisposable = vscode.window.onDidChangeWindowState((e: vscode.WindowState) => {
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        if (config.get('autoRespond') && e.active) {
            handleActiveDialog(providerManager);
        }
    });

    // Register manual response command
    const respondCommandDisposable = vscode.commands.registerCommand('hex-quick-responder.respond', () => {
        handleActiveDialog(providerManager);
    });

    // Register command to add new response mappings
    const addResponseDisposable = vscode.commands.registerCommand('hex-quick-responder.addResponse', async () => {
        await addNewResponseMapping();
    });

    // Register command to add custom provider
    const addProviderDisposable = vscode.commands.registerCommand('hex-quick-responder.addProvider', async () => {
        await addCustomProvider(providerManager);
    });

    context.subscriptions.push(
        windowStateDisposable,
        respondCommandDisposable,
        addResponseDisposable,
        addProviderDisposable
    );
}

async function handleActiveDialog(providerManager: ProviderManager) {
    try {
        // Get configured responses
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const responses: ResponseMapping = config.get('responses') || {};
        const useAi = config.get('useAi') || false;

        // Show quick pick for available responses
        const items = Object.keys(responses).map(question => ({
            label: question,
            description: `Responds with: ${responses[question]}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a dialog response to trigger'
        });

        if (selected) {
            let response = responses[selected.label];

            // If AI processing is enabled and no predefined response exists
            if (useAi && !response) {
                try {
                    const providerId = config.get<string>('selectedProvider') || 'openrouter';
                    const provider = providerManager.getProvider(providerId);
                    
                    if (!provider) {
                        throw new Error(`Selected provider ${providerId} not found`);
                    }

                    let modelId = config.get<string>('selectedModel');
                    if (!modelId) {
                        modelId = provider.defaultModel;
                        await config.update('selectedModel', modelId, vscode.ConfigurationTarget.Global);
                    }

                    const result = await providerManager.processMessage(providerId, modelId, selected.label);
                    response = result.content;

                    // Show cost information
                    if (result.usage) {
                        vscode.window.showInformationMessage(
                            `AI Processing Cost: $${result.usage.estimatedCost.toFixed(4)} ` +
                            `(${result.usage.totalTokens} tokens)`
                        );
                    }
                } catch (error) {
                    console.error('AI processing error:', error);
                    vscode.window.showErrorMessage(`AI processing failed: ${error}`);
                    return;
                }
            }

            if (response) {
                await vscode.window.showInformationMessage(
                    selected.label,
                    { modal: true },
                    response
                );
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Hex Quick Responder Error: ${error}`);
    }
}

async function addNewResponseMapping(defaultQuestion?: string) {
    const question = await vscode.window.showInputBox({
        prompt: 'Enter the dialog question to match',
        placeHolder: 'e.g., Save changes?',
        value: defaultQuestion
    });

    if (question) {
        const response = await vscode.window.showInputBox({
            prompt: 'Enter the response to automatically select',
            placeHolder: 'e.g., Yes'
        });

        if (response) {
            const config = vscode.workspace.getConfiguration('hexQuickResponder');
            const responses: ResponseMapping = config.get('responses') || {};
            responses[question] = response;
            
            await config.update('responses', responses, vscode.ConfigurationTarget.Global);
            await vscode.window.showInformationMessage(
                `Hex Quick Responder: Added mapping "${question}" → "${response}"`
            );
        }
    }
}

async function addCustomProvider(providerManager: ProviderManager) {
    try {
        const providerJson = await vscode.window.showInputBox({
            prompt: 'Enter the provider configuration in JSON format',
            placeHolder: '{"id": "custom", "name": "Custom Provider", ...}',
            validateInput: (value) => {
                try {
                    const config = JSON.parse(value);
                    if (!config.id || !config.name || !config.baseUrl || !config.models) {
                        return 'Invalid provider configuration. Required fields: id, name, baseUrl, models';
                    }
                    return null;
                } catch {
                    return 'Invalid JSON format';
                }
            }
        });

        if (providerJson) {
            const providerConfig: ProviderConfig = JSON.parse(providerJson);
            providerManager.addCustomProvider(providerConfig);

            const config = vscode.workspace.getConfiguration('hexQuickResponder');
            const customProviders: ProviderConfig[] = config.get('customProviders') || [];
            customProviders.push(providerConfig);
            
            await config.update('customProviders', customProviders, vscode.ConfigurationTarget.Global);
            await vscode.window.showInformationMessage(
                `Added custom provider: ${providerConfig.name}`
            );
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to add custom provider: ${error}`);
    }
}

export function deactivate() {}
