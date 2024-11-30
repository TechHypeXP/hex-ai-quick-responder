"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockResponse = void 0;
exports.createMockResponse = createMockResponse;
// Mock Response class that matches the minimum interface needed for tests
class MockResponse {
    constructor(ok, _data, statusText = ok ? 'OK' : 'Error') {
        this.ok = ok;
        this._data = _data;
        this.statusText = statusText;
    }
    async json() {
        return this._data;
    }
}
exports.MockResponse = MockResponse;
// Helper function to create a mock response
function createMockResponse(ok, data) {
    return new MockResponse(ok, data);
}
//# sourceMappingURL=types.js.map