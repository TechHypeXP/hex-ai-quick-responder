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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const rateLimiter_1 = require("../../api/rateLimit/rateLimiter");
const sinon_1 = __importDefault(require("sinon"));
suite('RateLimiter Test Suite', () => {
    let rateLimiter;
    const clock = sinon_1.default.useFakeTimers();
    setup(() => {
        rateLimiter = rateLimiter_1.RateLimiter.getInstance();
    });
    teardown(() => {
        clock.restore();
    });
    test('getInstance returns singleton instance', () => {
        const instance1 = rateLimiter_1.RateLimiter.getInstance();
        const instance2 = rateLimiter_1.RateLimiter.getInstance();
        assert.strictEqual(instance1, instance2);
    });
    test('checkRateLimit enforces cooldown period', async () => {
        const providerId = 'test-provider';
        // Simulate rate limit error
        rateLimiter.handleError(providerId, new Error('rate limit exceeded'));
        const startTime = Date.now();
        await rateLimiter.checkRateLimit(providerId);
        const endTime = Date.now();
        // Should wait at least minimum backoff (30 seconds)
        assert.ok(endTime - startTime >= 30000);
    });
    test('exponential backoff increases with consecutive failures', () => {
        const providerId = 'test-provider';
        const error = new Error('rate limit exceeded');
        // First failure
        rateLimiter.handleError(providerId, error);
        let status = rateLimiter.getProviderStatus(providerId);
        assert.strictEqual(status.consecutiveFailures, 1);
        const firstBackoff = status.currentBackoff;
        // Second failure
        rateLimiter.handleError(providerId, error);
        status = rateLimiter.getProviderStatus(providerId);
        assert.strictEqual(status.consecutiveFailures, 2);
        assert.ok(status.currentBackoff > firstBackoff);
    });
    test('backoff resets after success period', () => {
        const providerId = 'test-provider';
        // Simulate failure
        rateLimiter.handleError(providerId, new Error('rate limit exceeded'));
        let status = rateLimiter.getProviderStatus(providerId);
        assert.ok(status.isInCooldown);
        // Advance time past cooldown reset period (5 minutes)
        clock.tick(300001);
        // Simulate success
        rateLimiter.handleSuccess(providerId);
        status = rateLimiter.getProviderStatus(providerId);
        assert.strictEqual(status.consecutiveFailures, 0);
        assert.strictEqual(status.isInCooldown, false);
    });
    test('rate limit detection for various error messages', () => {
        const providerId = 'test-provider';
        const errorMessages = [
            'rate limit exceeded',
            'too many requests',
            'model capacity reached',
            'token limit exceeded',
            'request timeout'
        ];
        errorMessages.forEach(msg => {
            rateLimiter.handleError(providerId, new Error(msg));
            const status = rateLimiter.getProviderStatus(providerId);
            assert.ok(status.isInCooldown, `Should detect rate limit for: ${msg}`);
        });
    });
    test('jitter adds randomness to backoff', () => {
        const providerId = 'test-provider';
        const error = new Error('rate limit exceeded');
        const backoffs = new Set();
        // Collect multiple backoff values
        for (let i = 0; i < 10; i++) {
            rateLimiter.handleError(providerId, error);
            const status = rateLimiter.getProviderStatus(providerId);
            backoffs.add(status.currentBackoff);
        }
        // Should have different backoff values due to jitter
        assert.ok(backoffs.size > 1);
    });
    test('respects maximum backoff limit', () => {
        const providerId = 'test-provider';
        const error = new Error('rate limit exceeded');
        // Force multiple failures to reach max backoff
        for (let i = 0; i < 10; i++) {
            rateLimiter.handleError(providerId, error);
        }
        const status = rateLimiter.getProviderStatus(providerId);
        assert.ok(status.currentBackoff <= 600000); // Max 10 minutes
    });
    test('concurrent rate limit checks', async () => {
        const providerId = 'test-provider';
        // Simulate rate limit state
        rateLimiter.handleError(providerId, new Error('rate limit exceeded'));
        // Try multiple concurrent checks
        const checks = Promise.all([
            rateLimiter.checkRateLimit(providerId),
            rateLimiter.checkRateLimit(providerId),
            rateLimiter.checkRateLimit(providerId)
        ]);
        await assert.doesNotReject(checks);
    });
});
//# sourceMappingURL=rateLimiter.test.js.map