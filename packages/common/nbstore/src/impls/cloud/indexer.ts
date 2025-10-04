import { Observable } from 'rxjs';

import {
  type AggregateOptions,
  type AggregateResult,
  type IndexerDocument,
  type IndexerSchema,
  IndexerStorageBase,
  type Query,
  type SearchOptions,
  type SearchResult,
} from '../../storage/indexer';

interface CloudIndexerStorageOptions {
  serverBaseUrl: string;
  id: string;
}

// GraphQL 已彻底移除：云索引功能禁用占位实现
export class CloudIndexerStorage extends IndexerStorageBase {
  static readonly identifier = 'CloudIndexerStorage';
  readonly isReadonly = true;

  constructor(private readonly _options: CloudIndexerStorageOptions) {
    super();
  }

  override async search<
    T extends keyof IndexerSchema,
    const O extends SearchOptions<T>,
  >(_table: T, _query: Query<T>, _options?: O): Promise<SearchResult<T, O>> {
    throw new Error('CloudIndexerStorage is disabled: GraphQL backend removed');
  }

  override search$<
    T extends keyof IndexerSchema,
    const O extends SearchOptions<T>,
  >(_table: T, _query: Query<T>, _options?: O): Observable<SearchResult<T, O>> {
    return new Observable(observer => {
      observer.error(
        new Error('CloudIndexerStorage is disabled: GraphQL backend removed')
      );
    });
  }

  override async aggregate<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    _table: T,
    _query: Query<T>,
    _field: keyof IndexerSchema[T],
    _options?: O
  ): Promise<AggregateResult<T, O>> {
    throw new Error('CloudIndexerStorage is disabled: GraphQL backend removed');
  }

  override aggregate$<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    _table: T,
    _query: Query<T>,
    _field: keyof IndexerSchema[T],
    _options?: O
  ): Observable<AggregateResult<T, O>> {
    return new Observable(observer => {
      observer.error(
        new Error('CloudIndexerStorage is disabled: GraphQL backend removed')
      );
    });
  }

  override deleteByQuery<T extends keyof IndexerSchema>(
    _table: T,
    _query: Query<T>
  ): Promise<void> {
    return Promise.resolve();
  }

  override insert<T extends keyof IndexerSchema>(
    _table: T,
    _document: IndexerDocument<T>
  ): Promise<void> {
    return Promise.resolve();
  }

  override delete<T extends keyof IndexerSchema>(
    _table: T,
    _id: string
  ): Promise<void> {
    return Promise.resolve();
  }

  override update<T extends keyof IndexerSchema>(
    _table: T,
    _document: IndexerDocument<T>
  ): Promise<void> {
    return Promise.resolve();
  }

  override refresh<T extends keyof IndexerSchema>(_table: T): Promise<void> {
    return Promise.resolve();
  }
}
