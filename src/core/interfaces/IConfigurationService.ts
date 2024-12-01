export interface ProviderConfig {
    id: string;
    apiKey?: string;
    defaultModel?: string;
    rateLimit?: {
        requestsPerMinute: number;
        requestsPerHour: number;
    };
    enabled: boolean;
}

export interface SafetyConfig {
    sensitivityLevel: 'low' | 'medium' | 'high';
    protectedResources: string[];
    restrictedOperations: string[];
    aiSafetyEnabled: boolean;
}

export interface ExtensionConfig {
    enableAIAssist: boolean;
    experimentalFeaturesEnabled: boolean;
    telemetryEnabled: boolean;
    privacyMode: boolean;
    loggingLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WindsurfIntegrationConfig {
    autoSync: boolean;
    preferredProviders: string[];
    debugMode: boolean;
    syncInterval: number; // in minutes
}

export interface ConfigurationSchema {
    providers: Record<string, ProviderConfig>;
    safety: SafetyConfig;
    extension: ExtensionConfig;
    windsurfIntegration: WindsurfIntegrationConfig;
}

export interface ConfigurationChangeEvent<K extends keyof ConfigurationSchema> {
    key: K;
    oldValue: ConfigurationSchema[K];
    newValue: ConfigurationSchema[K];
    timestamp: number;
}

export interface IConfigurationService {
    // Advanced configuration retrieval
    getConfiguration<K extends keyof ConfigurationSchema>(
        key: K, 
        options?: {
            includeDefaults?: boolean;
            resolveSecrets?: boolean;
        }
    ): Promise<ConfigurationSchema[K]>;

    // Comprehensive configuration update
    updateConfiguration<K extends keyof ConfigurationSchema>(
        key: K, 
        value: Partial<ConfigurationSchema[K]>,
        options?: {
            persist?: boolean;
            validate?: boolean;
        }
    ): Promise<boolean>;

    // Secure credential management
    setSecureCredential(
        provider: string, 
        credential: string,
        options?: {
            encrypt?: boolean;
            overwrite?: boolean;
        }
    ): Promise<boolean>;

    getSecureCredential(
        provider: string,
        options?: {
            decrypt?: boolean;
        }
    ): Promise<string | null>;

    // Configuration validation and reset
    validateConfiguration(
        config?: Partial<ConfigurationSchema>
    ): Promise<{
        isValid: boolean;
        errors?: string[];
    }>;

    resetToDefaultConfiguration(
        scope?: keyof ConfigurationSchema
    ): Promise<void>;

    // Advanced observability
    onConfigurationChanged<K extends keyof ConfigurationSchema>(
        key: K, 
        callback: (event: ConfigurationChangeEvent<K>) => void
    ): () => void;

    // Environment and runtime context
    getCurrentEnvironment(): 'development' | 'production' | 'staging';
    
    // Export and import configurations
    exportConfiguration(): Promise<string>;
    importConfiguration(
        configString: string,
        options?: {
            merge?: boolean;
            validate?: boolean;
        }
    ): Promise<boolean>;
}

// Default configuration template
export const DEFAULT_CONFIGURATION: ConfigurationSchema = {
    providers: {
        openai: {
            id: 'openai',
            defaultModel: 'gpt-3.5-turbo',
            rateLimit: {
                requestsPerMinute: 60,
                requestsPerHour: 500
            },
            enabled: true
        }
    },
    safety: {
        sensitivityLevel: 'medium',
        protectedResources: [
            '.env', 'credentials', 'config', 
            'secret', 'key', 'token'
        ],
        restrictedOperations: [
            'delete', 'remove', 'destroy', 
            'force', 'override', 'reset'
        ],
        aiSafetyEnabled: true
    },
    extension: {
        enableAIAssist: true,
        experimentalFeaturesEnabled: false,
        telemetryEnabled: true,
        privacyMode: false,
        loggingLevel: 'info'
    },
    windsurfIntegration: {
        autoSync: true,
        preferredProviders: ['openai', 'anthropic'],
        debugMode: false,
        syncInterval: 30
    }
};
