import { RequestInit } from 'node-fetch';
import sinon from 'sinon';

// Mock Response class that matches the minimum interface needed for tests
export class MockResponse {
    constructor(
        public readonly ok: boolean,
        private readonly _data: unknown,
        public readonly statusText: string = ok ? 'OK' : 'Error'
    ) {}

    async json(): Promise<unknown> {
        return this._data;
    }
}

// Type for the fetch function
export type FetchFunction = (url: string | URL, init?: RequestInit) => Promise<MockResponse>;

// Extend globalThis to include our fetch type
declare global {
    interface GlobalThis {
        fetch: FetchFunction;
    }
}

// Type for sinon stub of fetch
export type FetchStub = sinon.SinonStub<Parameters<FetchFunction>, ReturnType<FetchFunction>>;

// Helper function to create a mock response
export function createMockResponse(ok: boolean, data: unknown): MockResponse {
    return new MockResponse(ok, data);
}
