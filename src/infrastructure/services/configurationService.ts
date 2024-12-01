import { injectable, inject } from 'inversify';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { 
    IConfigurationService, 
    ConfigurationSchema,
    ConfigurationChangeEvent,
    DEFAULT_CONFIGURATION
} from '../../core/interfaces/IConfigurationService';
import { TYPES } from '../types';
import { ISecureStorageService } from '../../core/interfaces/ISecureStorageService';
import { IErrorHandlingService } from '../../core/interfaces/IErrorHandlingService';

@injectable()
export class ConfigurationService implements IConfigurationService {
    private _configuration: ConfigurationSchema;
    private _configChangeEmitter = new vscode.EventEmitter<{
        key: keyof ConfigurationSchema;
        event: ConfigurationChangeEvent<any>;
    }>();

    constructor(
        @inject(TYPES.secureStorageService) 
        private _secureStorageService: ISecureStorageService,
        @inject(TYPES.errorHandlingService)
        private _errorHandlingService: IErrorHandlingService
    ) {
        this._configuration = { ...DEFAULT_CONFIGURATION };
        this._initializeConfiguration();
    }

    private async _initializeConfiguration(): Promise<void> {
        try {
            await this._loadPersistedConfiguration();
        } catch (error) {
            this._errorHandlingService.logError(
                this._errorHandlingService.classifyError(error)
            );
        }
    }

    private async _loadPersistedConfiguration(): Promise<void> {
        const persistedConfig = await this._secureStorageService.get('extensionConfig');
        if (persistedConfig) {
            try {
                const parsedConfig = JSON.parse(persistedConfig);
                this._configuration = {
                    ...this._configuration,
                    ...parsedConfig
                };
            } catch (error) {
                // Log parsing error, fallback to default
                await this.resetToDefaultConfiguration();
            }
        }
    }

    private async _persistConfiguration(): Promise<void> {
        await this._secureStorageService.set(
            'extensionConfig', 
            JSON.stringify(this._configuration)
        );
    }

    async getConfiguration<K extends keyof ConfigurationSchema>(
        key: K, 
        options: { 
            includeDefaults?: boolean; 
            resolveSecrets?: boolean 
        } = {}
    ): Promise<ConfigurationSchema[K]> {
        const { 
            includeDefaults = false, 
            resolveSecrets = false 
        } = options;

        let config = this._configuration[key];

        if (includeDefaults) {
            config = {
                ...DEFAULT_CONFIGURATION[key],
                ...config
            };
        }

        // Placeholder for potential secret resolution
        if (resolveSecrets && key === 'providers') {
            // Implement secure credential resolution if needed
        }

        return config;
    }

    async updateConfiguration<K extends keyof ConfigurationSchema>(
        key: K, 
        value: Partial<ConfigurationSchema[K]>,
        options: { 
            persist?: boolean; 
            validate?: boolean 
        } = {}
    ): Promise<boolean> {
        const { 
            persist = true, 
            validate = true 
        } = options;

        if (validate) {
            const validationResult = await this.validateConfiguration({ [key]: value });
            if (!validationResult.isValid) {
                // Log validation errors
                validationResult.errors?.forEach(error => 
                    this._errorHandlingService.logError({
                        category: 'configuration',
                        severity: 'medium',
                        message: error
                    })
                );
                return false;
            }
        }

        const oldValue = this._configuration[key];
        this._configuration[key] = {
            ...oldValue,
            ...value
        };

        // Emit configuration change event
        this._configChangeEmitter.fire({
            key,
            event: {
                key,
                oldValue,
                newValue: this._configuration[key],
                timestamp: Date.now()
            }
        });

        if (persist) {
            await this._persistConfiguration();
        }

        return true;
    }

    async setSecureCredential(
        provider: string, 
        credential: string,
        options: { 
            encrypt?: boolean; 
            overwrite?: boolean 
        } = {}
    ): Promise<boolean> {
        const { 
            encrypt = true, 
            overwrite = false 
        } = options;

        const storageKey = `provider_${provider}_credential`;
        
        // Check if credential already exists
        const existingCredential = await this.getSecureCredential(provider);
        if (existingCredential && !overwrite) {
            return false;
        }

        // Optional encryption
        const storedCredential = encrypt 
            ? this._encryptCredential(credential)
            : credential;

        await this._secureStorageService.set(storageKey, storedCredential);
        return true;
    }

    async getSecureCredential(
        provider: string,
        options: { 
            decrypt?: boolean 
        } = {}
    ): Promise<string | null> {
        const { decrypt = true } = options;
        
        const storageKey = `provider_${provider}_credential`;
        const credential = await this._secureStorageService.get(storageKey);

        if (!credential) return null;

        return decrypt 
            ? this._decryptCredential(credential)
            : credential;
    }

    private _encryptCredential(credential: string): string {
        // Simple encryption (replace with more robust method)
        const cipher = crypto.createCipher('aes-256-cbc', 'hex-ai-secret-key');
        let encrypted = cipher.update(credential, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    private _decryptCredential(encryptedCredential: string): string {
        // Simple decryption (replace with more robust method)
        const decipher = crypto.createDecipher('aes-256-cbc', 'hex-ai-secret-key');
        let decrypted = decipher.update(encryptedCredential, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    async validateConfiguration(
        config?: Partial<ConfigurationSchema>
    ): Promise<{ isValid: boolean; errors?: string[] }> {
        const errors: string[] = [];

        if (config?.providers) {
            Object.values(config.providers).forEach(provider => {
                if (!provider.id) errors.push('Provider must have an ID');
                if (provider.rateLimit && 
                    (provider.rateLimit.requestsPerMinute < 0 || 
                     provider.rateLimit.requestsPerHour < 0)) {
                    errors.push('Invalid rate limit values');
                }
            });
        }

        if (config?.safety) {
            if (!['low', 'medium', 'high'].includes(config.safety.sensitivityLevel)) {
                errors.push('Invalid sensitivity level');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    async resetToDefaultConfiguration(
        scope?: keyof ConfigurationSchema
    ): Promise<void> {
        if (scope) {
            this._configuration[scope] = DEFAULT_CONFIGURATION[scope];
        } else {
            this._configuration = { ...DEFAULT_CONFIGURATION };
        }

        await this._persistConfiguration();
    }

    onConfigurationChanged<K extends keyof ConfigurationSchema>(
        key: K, 
        callback: (event: ConfigurationChangeEvent<K>) => void
    ): () => void {
        const listener = this._configChangeEmitter.event(
            (event) => {
                if (event.key === key) {
                    callback(event.event);
                }
            }
        );

        return () => listener.dispose();
    }

    getCurrentEnvironment(): 'development' | 'production' | 'staging' {
        return vscode.env.uiKind === vscode.UIKind.Web 
            ? 'development' 
            : 'production';
    }

    async exportConfiguration(): Promise<string> {
        return JSON.stringify(this._configuration, null, 2);
    }

    async importConfiguration(
        configString: string,
        options: { 
            merge?: boolean; 
            validate?: boolean 
        } = {}
    ): Promise<boolean> {
        const { 
            merge = false, 
            validate = true 
        } = options;

        try {
            const importedConfig = JSON.parse(configString);

            if (validate) {
                const validationResult = await this.validateConfiguration(importedConfig);
                if (!validationResult.isValid) {
                    return false;
                }
            }

            if (merge) {
                this._configuration = {
                    ...this._configuration,
                    ...importedConfig
                };
            } else {
                this._configuration = importedConfig;
            }

            await this._persistConfiguration();
            return true;
        } catch (error) {
            this._errorHandlingService.logError(
                this._errorHandlingService.classifyError(error)
            );
            return false;
        }
    }
}
