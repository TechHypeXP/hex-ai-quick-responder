import * as vscode from 'vscode';
export declare function sleep(ms: number): Promise<void>;
export declare function clearConfiguration(): Promise<void>;
export declare function setupTestConfiguration(): Promise<void>;
export declare function waitForExtensionActivation(): Promise<void>;
export declare function mockQuickPick(items: string[]): Thenable<vscode.QuickPickItem | undefined>;
export declare function mockInputBox(value: string): Thenable<string | undefined>;
