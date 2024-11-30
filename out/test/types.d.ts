import { RequestInit } from 'node-fetch';
import sinon from 'sinon';
export declare class MockResponse {
    readonly ok: boolean;
    private readonly _data;
    readonly statusText: string;
    constructor(ok: boolean, _data: unknown, statusText?: string);
    json(): Promise<unknown>;
}
export type FetchFunction = (url: string | URL, init?: RequestInit) => Promise<MockResponse>;
declare global {
    interface GlobalThis {
        fetch: FetchFunction;
    }
}
export type FetchStub = sinon.SinonStub<Parameters<FetchFunction>, ReturnType<FetchFunction>>;
export declare function createMockResponse(ok: boolean, data: unknown): MockResponse;
