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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const providerManager_1 = require("./api/providers/providerManager");
function activate(context) {
    console.log('Hex Quick Responder is now active!');
    // Initialize Provider Manager
    const providerManager = providerManager_1.ProviderManager.getInstance();
    // Monitor window state changes to auto-respond to dialogs
    const windowStateDisposable = vscode.window.onDidChangeWindowState((e) => {
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
    context.subscriptions.push(windowStateDisposable, respondCommandDisposable, addResponseDisposable, addProviderDisposable);
}
async function handleActiveDialog(providerManager) {
    try {
        // Get configured responses
        const config = vscode.workspace.getConfiguration('hexQuickResponder');
        const responses = config.get('responses') || {};
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
                    const providerId = config.get('selectedProvider') || 'openrouter';
                    const provider = providerManager.getProvider(providerId);
                    if (!provider) {
                        throw new Error(`Selected provider ${providerId} not found`);
                    }
                    let modelId = config.get('selectedModel');
                    if (!modelId) {
                        modelId = provider.defaultModel;
                        await config.update('selectedModel', modelId, vscode.ConfigurationTarget.Global);
                    }
                    const result = await providerManager.processMessage(providerId, modelId, selected.label);
                    response = result.content;
                    // Show cost information
                    if (result.usage) {
                        vscode.window.showInformationMessage(`AI Processing Cost: $${result.usage.estimatedCost.toFixed(4)} ` +
                            `(${result.usage.totalTokens} tokens)`);
                    }
                }
                catch (error) {
                    console.error('AI processing error:', error);
                    vscode.window.showErrorMessage(`AI processing failed: ${error}`);
                    return;
                }
            }
            if (response) {
                await vscode.window.showInformationMessage(selected.label, { modal: true }, response);
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Hex Quick Responder Error: ${error}`);
    }
}
async function addNewResponseMapping(defaultQuestion) {
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
            const responses = config.get('responses') || {};
            responses[question] = response;
            await config.update('responses', responses, vscode.ConfigurationTarget.Global);
            await vscode.window.showInformationMessage(`Hex Quick Responder: Added mapping "${question}" → "${response}"`);
        }
    }
}
async function addCustomProvider(providerManager) {
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
                }
                catch {
                    return 'Invalid JSON format';
                }
            }
        });
        if (providerJson) {
            const providerConfig = JSON.parse(providerJson);
            providerManager.addCustomProvider(providerConfig);
            const config = vscode.workspace.getConfiguration('hexQuickResponder');
            const customProviders = config.get('customProviders') || [];
            customProviders.push(providerConfig);
            await config.update('customProviders', customProviders, vscode.ConfigurationTarget.Global);
            await vscode.window.showInformationMessage(`Added custom provider: ${providerConfig.name}`);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to add custom provider: ${error}`);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map