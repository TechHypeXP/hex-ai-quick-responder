import * as vscode from 'vscode';

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function clearConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('hexQuickResponder');
    await config.update('responses', undefined, vscode.ConfigurationTarget.Global);
    await config.update('autoRespond', undefined, vscode.ConfigurationTarget.Global);
}

export async function setupTestConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('hexQuickResponder');
    await config.update('responses', {
        'Test Question?': 'Yes',
        'Save changes?': 'Yes'
    }, vscode.ConfigurationTarget.Global);
    await config.update('autoRespond', true, vscode.ConfigurationTarget.Global);
}

export async function waitForExtensionActivation(): Promise<void> {
    const extension = vscode.extensions.getExtension('HexProperty.Hex-Quick-Responder');
    if (extension) {
        if (!extension.isActive) {
            await extension.activate();
        }
        await sleep(100); // Give the extension a moment to fully activate
    }
}

export function mockQuickPick(items: string[]): Thenable<vscode.QuickPickItem | undefined> {
    return Promise.resolve({
        label: items[0],
        description: `Responds with: Yes`
    });
}

export function mockInputBox(value: string): Thenable<string | undefined> {
    return Promise.resolve(value);
}
