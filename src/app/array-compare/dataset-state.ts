import {
  collectTopLevelKeys,
  findDuplicates,
  formatJson,
  isPrimitiveArray,
  pickObjectFields,
  toPrimitiveArray,
} from '@/lib/array-cleaner';

import type { DatasetState, PreparedDataset } from './types';

export const createDataset = (id: number): DatasetState => ({
  asPrimitive: false,
  checkedDuplicates: false,
  compareSelected: false,
  dedupedItems: null,
  error: '',
  id,
  parsedItems: null,
  selectedFields: [],
  sourceText: '',
});

export const resetDerivedDatasetState = (
  dataset: DatasetState,
): DatasetState => ({
  ...dataset,
  checkedDuplicates: false,
  compareSelected: false,
  dedupedItems: null,
});

export const prepareDataset = (dataset: DatasetState): PreparedDataset => {
  const fields = dataset.parsedItems
    ? collectTopLevelKeys(dataset.parsedItems)
    : [];
  const pickedItems = dataset.parsedItems
    ? pickObjectFields(dataset.parsedItems, dataset.selectedFields)
    : null;
  const selectedField = dataset.selectedFields[0];
  const cleanedItems =
    pickedItems &&
    dataset.asPrimitive &&
    dataset.selectedFields.length === 1 &&
    selectedField
      ? toPrimitiveArray(pickedItems, selectedField)
      : pickedItems;
  const activeItems = dataset.dedupedItems ?? cleanedItems;
  const isDirectValueDataset = dataset.parsedItems
    ? isPrimitiveArray(dataset.parsedItems)
    : false;
  const isPrimitiveReady =
    isDirectValueDataset ||
    (dataset.asPrimitive && dataset.selectedFields.length === 1);
  const duplicates =
    dataset.checkedDuplicates && cleanedItems
      ? findDuplicates(cleanedItems)
      : [];
  const canUsePrimitiveTools = isPrimitiveReady && Boolean(cleanedItems);

  return {
    ...dataset,
    activeItems,
    canCompare: Boolean(cleanedItems) && isPrimitiveReady,
    canUsePrimitiveTools,
    cleanedItems,
    duplicates,
    fields,
    output: activeItems ? formatJson(activeItems) : '',
  };
};
