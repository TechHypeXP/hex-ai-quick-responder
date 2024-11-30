import * as assert from 'assert';
import { RateLimiter } from '../../api/rateLimit/rateLimiter';
import sinon from 'sinon';

suite('RateLimiter Test Suite', () => {
    let rateLimiter: RateLimiter;
    const clock = sinon.useFakeTimers();

    setup(() => {
        rateLimiter = RateLimiter.getInstance();
    });

    teardown(() => {
        clock.restore();
    });

    test('getInstance returns singleton instance', () => {
        const instance1 = RateLimiter.getInstance();
        const instance2 = RateLimiter.getInstance();
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
