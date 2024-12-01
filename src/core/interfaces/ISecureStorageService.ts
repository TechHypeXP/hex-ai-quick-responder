export interface ISecureStorageService {
    // Set a secure key-value pair
    set(key: string, value: string): Promise<void>;

    // Retrieve a secure value by key
    get(key: string): Promise<string | null>;

    // Delete a secure key-value pair
    delete(key: string): Promise<void>;

    // Check if a key exists
    has(key: string): Promise<boolean>;

    // Clear all stored secure values
    clear(): Promise<void>;
}
