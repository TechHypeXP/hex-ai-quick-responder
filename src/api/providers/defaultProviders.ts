import { ProviderConfig } from './types';

export const defaultProviders: ProviderConfig[] = [
    {
        id: 'openrouter',
        name: 'OpenRouter.ai',
        baseUrl: 'https://openrouter.ai/api/v1',
        headerTemplate: {
            httpReferer: 'vscode-hex-quick-responder',
            xTitle: 'Hex Quick Responder',
            contentType: 'application/json'
        },
        models: [
            {
                id: 'qwen/qwq-32b-preview',
                name: 'Qwen 32B',
                contextLength: 32768,
                costPer1kTokens: 0.0015,
                description: 'High performance model with strong reasoning capabilities'
            },
            {
                id: 'anthropic/claude-2',
                name: 'Claude 2',
                contextLength: 100000,
                costPer1kTokens: 0.0025,
                description: 'Powerful model with extensive knowledge and capabilities'
            }
        ],
        defaultModel: 'qwen/qwq-32b-preview'
    },
    {
        id: 'together',
        name: 'Together.ai',
        baseUrl: 'https://api.together.xyz',
        headerTemplate: {
            contentType: 'application/json'
        },
        models: [
            {
                id: 'togethercomputer/llama-2-70b-chat',
                name: 'Llama 2 70B',
                contextLength: 4096,
                costPer1kTokens: 0.0009,
                description: 'Open source large language model fine-tuned for chat'
            }
        ],
        defaultModel: 'togethercomputer/llama-2-70b-chat'
    },
    {
        id: 'anthropic',
        name: 'Anthropic Direct',
        baseUrl: 'https://api.anthropic.com/v1',
        headerTemplate: {
            anthropicVersion: '2023-06-01',
            contentType: 'application/json'
        },
        models: [
            {
                id: 'claude-2',
                name: 'Claude 2',
                contextLength: 100000,
                costPer1kTokens: 0.0008,
                description: 'Latest Claude model with enhanced capabilities'
            },
            {
                id: 'claude-instant-1',
                name: 'Claude Instant',
                contextLength: 100000,
                costPer1kTokens: 0.0002,
                description: 'Faster, more cost-effective version of Claude'
            }
        ],
        defaultModel: 'claude-2'
    }
];
