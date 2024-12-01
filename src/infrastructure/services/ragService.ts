import { injectable, inject } from 'inversify';
import { 
    IRagService, 
    RagDocument, 
    RagQuery, 
    RagSearchResult,
    RagCategory 
} from '../../core/interfaces/IRagService';
import { IProviderManager } from '../../core/interfaces/IProviderManager';
import { TYPES } from '../types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@injectable()
export class RagService implements IRagService {
    private _documents: Map<string, RagDocument>;
    private _vectorStore: Map<string, number[]>;
    private _categoryIndices: Map<RagCategory, Set<string>>;
    private _storageDir: string;

    constructor(
        @inject(TYPES.ProviderManager) private _providerManager: IProviderManager
    ) {
        this._documents = new Map();
        this._vectorStore = new Map();
        this._categoryIndices = new Map();
        this._storageDir = path.join(process.cwd(), '.rag-store');
        this._initializeStorage();
    }

    private async _initializeStorage(): Promise<void> {
        try {
            await fs.mkdir(this._storageDir, { recursive: true });
            await this._loadExistingData();
        } catch (error) {
            console.error('Failed to initialize RAG storage:', error);
        }
    }

    private async _loadExistingData(): Promise<void> {
        try {
            const files = await fs.readdir(this._storageDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(
                        path.join(this._storageDir, file),
                        'utf-8'
                    );
                    const doc: RagDocument = JSON.parse(content);
                    this._documents.set(doc.id, doc);
                    this._indexDocument(doc);
                }
            }
        } catch (error) {
            console.error('Failed to load existing RAG data:', error);
        }
    }

    private _indexDocument(doc: RagDocument): void {
        // Update category index
        let categorySet = this._categoryIndices.get(doc.category);
        if (!categorySet) {
            categorySet = new Set();
            this._categoryIndices.set(doc.category, categorySet);
        }
        categorySet.add(doc.id);

        // Store vector if available
        if (doc.metadata.vectors) {
            this._vectorStore.set(doc.id, doc.metadata.vectors);
        }
    }

    async addDocument(doc: Omit<RagDocument, 'id'>): Promise<string> {
        const id = crypto.randomUUID();
        const vectors = await this.generateEmbedding(doc.content);
        
        const fullDoc: RagDocument = {
            ...doc,
            id,
            metadata: {
                ...doc.metadata,
                vectors
            }
        };

        this._documents.set(id, fullDoc);
        this._indexDocument(fullDoc);

        // Persist to disk
        await fs.writeFile(
            path.join(this._storageDir, `${id}.json`),
            JSON.stringify(fullDoc, null, 2)
        );

        return id;
    }

    async getDocument(id: string): Promise<RagDocument | null> {
        return this._documents.get(id) || null;
    }

    async updateDocument(
        id: string, 
        update: Partial<RagDocument>
    ): Promise<boolean> {
        const existing = await this.getDocument(id);
        if (!existing) return false;

        const updated: RagDocument = {
            ...existing,
            ...update,
            metadata: {
                ...existing.metadata,
                ...update.metadata
            }
        };

        if (update.content) {
            updated.metadata.vectors = await this.generateEmbedding(update.content);
        }

        this._documents.set(id, updated);
        this._indexDocument(updated);

        // Update persistence
        await fs.writeFile(
            path.join(this._storageDir, `${id}.json`),
            JSON.stringify(updated, null, 2)
        );

        return true;
    }

    async deleteDocument(id: string): Promise<boolean> {
        const doc = this._documents.get(id);
        if (!doc) return false;

        this._documents.delete(id);
        this._vectorStore.delete(id);
        
        const categorySet = this._categoryIndices.get(doc.category);
        if (categorySet) {
            categorySet.delete(id);
        }

        try {
            await fs.unlink(path.join(this._storageDir, `${id}.json`));
            return true;
        } catch {
            return false;
        }
    }

    async search(query: RagQuery): Promise<RagSearchResult> {
        const queryEmbedding = await this.generateEmbedding(query.query);
        let candidates = Array.from(this._documents.values());

        // Apply category filter
        if (query.category) {
            const categoryIds = this._categoryIndices.get(query.category);
            if (categoryIds) {
                candidates = candidates.filter(doc => categoryIds.has(doc.id));
            }
        }

        // Apply other filters
        if (query.filters) {
            candidates = this._applyFilters(candidates, query.filters);
        }

        // Calculate relevance scores
        const scores = await Promise.all(
            candidates.map(doc => this._calculateRelevance(doc, queryEmbedding))
        );

        // Sort by relevance
        const results = candidates
            .map((doc, i) => ({ doc, score: scores[i] }))
            .sort((a, b) => b.score - a.score);

        // Apply limit
        const limit = query.limit || 10;
        const topResults = results.slice(0, limit);

        return {
            documents: topResults.map(r => r.doc),
            relevanceScores: topResults.map(r => r.score),
            totalFound: results.length
        };
    }

    async getRelevantContext(
        query: string,
        category?: RagCategory
    ): Promise<string> {
        const results = await this.search({
            query,
            category,
            limit: 5
        });

        return results.documents
            .map(doc => doc.content)
            .join('\n\n');
    }

    async updateContext(context: any): Promise<void> {
        const doc: Omit<RagDocument, 'id'> = {
            category: context.type || 'business',
            content: typeof context === 'string' ? context : JSON.stringify(context),
            metadata: {
                timestamp: Date.now(),
                confidence: context.confidence || 1,
                source: context.source || 'system',
                tags: context.tags || []
            }
        };

        await this.addDocument(doc);
    }

    async getContextHistory(category: RagCategory): Promise<RagDocument[]> {
        const categoryIds = this._categoryIndices.get(category);
        if (!categoryIds) return [];

        return Array.from(categoryIds)
            .map(id => this._documents.get(id))
            .filter((doc): doc is RagDocument => !!doc)
            .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const provider = await this._providerManager.getDefaultProvider();
        
        // Use provider's embedding API
        const result = await provider.generateEmbedding(text);
        return result;
    }

    async findSimilar(
        embedding: number[], 
        limit: number = 10
    ): Promise<RagSearchResult> {
        const scores = Array.from(this._documents.values()).map(doc => ({
            doc,
            score: this._cosineSimilarity(embedding, doc.metadata.vectors || [])
        }));

        const results = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return {
            documents: results.map(r => r.doc),
            relevanceScores: results.map(r => r.score),
            totalFound: scores.length
        };
    }

    async optimize(): Promise<void> {
        // Implement vector store optimization
        // Could include:
        // - Reindexing
        // - Removing duplicates
        // - Compressing vectors
    }

    async backup(): Promise<string> {
        const backupId = crypto.randomUUID();
        const backupDir = path.join(this._storageDir, 'backups', backupId);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        // Backup all documents
        for (const [id, doc] of this._documents) {
            await fs.writeFile(
                path.join(backupDir, `${id}.json`),
                JSON.stringify(doc, null, 2)
            );
        }

        return backupId;
    }

    async restore(backupId: string): Promise<boolean> {
        const backupDir = path.join(this._storageDir, 'backups', backupId);
        
        try {
            // Clear current state
            this._documents.clear();
            this._vectorStore.clear();
            this._categoryIndices.clear();

            // Restore from backup
            await this._loadExistingData();
            return true;
        } catch {
            return false;
        }
    }

    private _applyFilters(
        docs: RagDocument[], 
        filters: RagQuery['filters']
    ): RagDocument[] {
        if (!filters) return docs;

        return docs.filter(doc => {
            if (filters.tags?.length) {
                if (!filters.tags.some(tag => doc.metadata.tags.includes(tag))) {
                    return false;
                }
            }

            if (filters.timeRange) {
                if (doc.metadata.timestamp < filters.timeRange.start ||
                    doc.metadata.timestamp > filters.timeRange.end) {
                    return false;
                }
            }

            if (filters.confidence !== undefined) {
                if (doc.metadata.confidence < filters.confidence) {
                    return false;
                }
            }

            return true;
        });
    }

    private async _calculateRelevance(
        doc: RagDocument,
        queryEmbedding: number[]
    ): Promise<number> {
        if (!doc.metadata.vectors) {
            doc.metadata.vectors = await this.generateEmbedding(doc.content);
            this._vectorStore.set(doc.id, doc.metadata.vectors);
        }

        return this._cosineSimilarity(queryEmbedding, doc.metadata.vectors);
    }

    private _cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
