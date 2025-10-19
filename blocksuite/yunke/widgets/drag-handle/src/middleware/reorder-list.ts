import { correctNumberedListsOrderToPrev } from '@blocksuite/yunke-block-list';
import { ListBlockModel } from '@blocksuite/yunke-model';
import { matchModels } from '@blocksuite/yunke-shared/utils';
import type { BlockStdScope } from '@blocksuite/std';
import type { TransformerMiddleware } from '@blocksuite/store';

export const reorderList =
  (std: BlockStdScope): TransformerMiddleware =>
  ({ slots }) => {
    const afterImportBlockSubscription = slots.afterImport.subscribe(
      payload => {
        if (payload.type === 'block') {
          const model = payload.model;
          if (
            matchModels(model, [ListBlockModel]) &&
            model.props.type === 'numbered'
          ) {
            const next = std.store.getNext(model);
            correctNumberedListsOrderToPrev(std.store, model);
            if (next) {
              correctNumberedListsOrderToPrev(std.store, next);
            }
          }
        }
      }
    );

    return () => {
      afterImportBlockSubscription.unsubscribe();
    };
  };
