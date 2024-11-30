# Hex Quick Responder

HexProperty's Automated Dialog Response System with AI Integration

## Features

- Automatically respond to common VS Code dialogs
- AI-powered responses using multiple LLM providers
- Configurable provider selection and model choices
- Cost tracking for AI usage
- Custom provider support through JSON configuration
- Secure API key management through environment variables

## Setup

1. Install the extension
2. Copy `.env.example` to `.env` and add your API keys:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   TOGETHER_API_KEY=your_together_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

## Configuration

### Extension Settings

* `hexQuickResponder.autoRespond`: Enable/disable automatic dialog responses
* `hexQuickResponder.useAi`: Enable/disable AI processing for unknown dialogs
* `hexQuickResponder.selectedProvider`: Selected LLM provider for AI processing
* `hexQuickResponder.selectedModel`: Selected model for the current provider
* `hexQuickResponder.responses`: Mapping of questions to their automatic responses
* `hexQuickResponder.customProviders`: List of custom LLM provider configurations

### Default Providers

1. OpenRouter.ai
   - Models: Qwen 32B, Claude 2
   - Features: Wide model selection, competitive pricing

2. Together.ai
   - Models: Llama 2 70B
   - Features: Open source models, cost-effective

3. Anthropic Direct
   - Models: Claude 2, Claude Instant
   - Features: High performance, extensive context window

## Adding Custom Providers

1. Command Palette > "Hex: Add Custom LLM Provider"
2. Enter provider configuration in JSON format:
   ```json
   {
     "id": "custom",
     "name": "Custom Provider",
     "baseUrl": "https://api.custom-provider.com",
     "headerTemplate": {
       "Content-Type": "application/json"
     },
     "models": [
       {
         "id": "model-1",
         "name": "Model One",
         "contextLength": 4096,
         "costPer1kTokens": 0.001,
         "description": "Description of the model"
       }
     ],
     "defaultModel": "model-1"
   }
   ```
3. Add corresponding API key to .env file:
   ```
   CUSTOM_API_KEY=your_api_key_here
   ```

## Commands

* `Hex: Quick Respond to Dialog` (Ctrl+Alt+H): Manually trigger dialog response
* `Hex: Add Quick Response Mapping`: Add new question/response mapping
* `Hex: Add Custom LLM Provider`: Add new provider configuration

## Three Iterations Methodology

The AI responses follow a structured approach:
1. Understand the core problem
2. Break it down into actionable steps
3. Execute with clear direction

This ensures responses are focused on getting things done efficiently.

## Security

- API keys are stored securely in the .env file
- Environment variables are used to prevent key exposure
- Custom provider configurations are stored in VS Code settings

## Cost Management

- Cost per request is displayed after each AI response
- Token usage tracking helps monitor API consumption
- Model selection allows choosing cost-effective options
