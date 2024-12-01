import * as vscode from 'vscode';
import { injectable } from 'inversify';
import { ISecureStorageService } from '../../core/interfaces/ISecureStorageService';

@injectable()
export class SecureStorageService implements ISecureStorageService {
    private _context: vscode.ExtensionContext;

    constructor() {
        // This will be set during extension activation
        this._context = null!;
    }

    // Method to be called during extension activation
    initialize(context: vscode.ExtensionContext): void {
        this._context = context;
    }

    async set(key: string, value: string): Promise<void> {
        if (!this._context) {
            throw new Error('Secure Storage Service not initialized');
        }
        await this._context.secrets.store(key, value);
    }

    async get(key: string): Promise<string | null> {
        if (!this._context) {
            throw new Error('Secure Storage Service not initialized');
        }
        return await this._context.secrets.get(key) ?? null;
    }

    async delete(key: string): Promise<void> {
        if (!this._context) {
            throw new Error('Secure Storage Service not initialized');
        }
        await this._context.secrets.delete(key);
    }

    async has(key: string): Promise<boolean> {
        if (!this._context) {
            throw new Error('Secure Storage Service not initialized');
        }
        const value = await this.get(key);
        return value !== null;
    }

    async clear(): Promise<void> {
        if (!this._context) {
            throw new Error('Secure Storage Service not initialized');
        }
        // Unfortunately, VS Code doesn't provide a direct method to clear all secrets
        // We would need to track and manually delete each key
    }
}
