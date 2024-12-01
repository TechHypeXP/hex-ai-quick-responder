export const TYPES = {
    // Core Services
    commandService: Symbol.for('CommandService'),
    analysisService: Symbol.for('AnalysisService'),
    providerManager: Symbol.for('ProviderManager'),
    ragService: Symbol.for('RagService'),
    iterationService: Symbol.for('IterationService'),

    // Infrastructure
    configurationService: Symbol.for('ConfigurationService'),
    loggingService: Symbol.for('LoggingService'),
    telemetryService: Symbol.for('TelemetryService'),

    // Cross-cutting
    monitoringService: Symbol.for('MonitoringService'),
    rateLimiter: Symbol.for('RateLimiter'),
    errorHandler: Symbol.for('ErrorHandler')
};
