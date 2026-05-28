import type { DuplicateEntry, JsonArray } from '@/lib/array-cleaner';

export interface DatasetState {
  asPrimitive: boolean;
  checkedDuplicates: boolean;
  compareSelected: boolean;
  dedupedItems: JsonArray | null;
  error: string;
  id: number;
  parsedItems: JsonArray | null;
  selectedFields: string[];
  sourceText: string;
}

export interface PreparedDataset extends DatasetState {
  activeItems: JsonArray | null;
  canCompare: boolean;
  canUsePrimitiveTools: boolean;
  cleanedItems: JsonArray | null;
  duplicates: DuplicateEntry[];
  fields: string[];
  output: string;
}
