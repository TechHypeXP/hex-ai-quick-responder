export type RagCategory = 'business' | 'improvement' | 'development' | 'decision' | 'command';

export interface RagDocument {
    id: string;
    category: RagCategory;
    content: string;
    metadata: {
        timestamp: number;
        confidence: number;
        source: string;
        tags: string[];
        vectors?: number[];
    };
    relationships?: {
        relatedIds: string[];
        strength: number;
    }[];
}

export interface RagQuery {
    category?: RagCategory;
    query: string;
    filters?: {
        tags?: string[];
        timeRange?: {
            start: number;
            end: number;
        };
        confidence?: number;
    };
    limit?: number;
}

export interface RagSearchResult {
    documents: RagDocument[];
    relevanceScores: number[];
    totalFound: number;
}

export interface IRagService {
    // Core operations
    addDocument(doc: Omit<RagDocument, 'id'>): Promise<string>;
    getDocument(id: string): Promise<RagDocument | null>;
    updateDocument(id: string, update: Partial<RagDocument>): Promise<boolean>;
    deleteDocument(id: string): Promise<boolean>;

    // Search and retrieval
    search(query: RagQuery): Promise<RagSearchResult>;
    getRelevantContext(query: string): Promise<string>;
    
    // Context management
    updateContext(key: string, data: any): Promise<void>;
    getContextHistory(category: RagCategory): Promise<RagDocument[]>;
    
    // Vector operations
    generateEmbedding(text: string): Promise<number[]>;
    findSimilar(embedding: number[], limit?: number): Promise<RagSearchResult>;
    
    // Maintenance
    optimize(): Promise<void>;
    backup(): Promise<string>;
    restore(backupId: string): Promise<boolean>;
}
