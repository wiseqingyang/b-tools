'use client';

import { useMemo, useState } from 'react';

import { comparePrimitiveArrays } from '@/lib/array-cleaner';

import { ComparisonPanel } from './comparison-panel';
import { DatasetPanel } from './dataset-panel';
import { createDataset, prepareDataset } from './dataset-state';
import styles from './page.module.css';
import type { DatasetState } from './types';

const ArrayComparePage = () => {
  const [nextDatasetId, setNextDatasetId] = useState(2);
  const [datasets, setDatasets] = useState<DatasetState[]>([createDataset(1)]);

  const preparedDatasets = useMemo(
    () => datasets.map((dataset) => prepareDataset(dataset)),
    [datasets],
  );
  const comparisonDatasets = preparedDatasets.filter(
    (dataset) => dataset.compareSelected && dataset.cleanedItems,
  );
  const comparison =
    comparisonDatasets.length >= 2 &&
    comparisonDatasets[0].cleanedItems &&
    comparisonDatasets[1].cleanedItems
      ? comparePrimitiveArrays(
          comparisonDatasets[0].cleanedItems,
          comparisonDatasets[1].cleanedItems,
        )
      : null;

  const updateDataset = (nextDataset: DatasetState) => {
    setDatasets((currentDatasets) =>
      currentDatasets.map((dataset) =>
        dataset.id === nextDataset.id ? nextDataset : dataset,
      ),
    );
  };

  const handleAddDataset = () => {
    setDatasets((currentDatasets) => [
      ...currentDatasets,
      createDataset(nextDatasetId),
    ]);
    setNextDatasetId((currentId) => currentId + 1);
  };

  return (
    <main className={styles.main}>
      <button
        aria-label="新增数据组"
        className={styles.addButton}
        type="button"
        onClick={handleAddDataset}
      >
        +
      </button>
      <div className={styles.datasets}>
        {preparedDatasets.map((dataset) => (
          <DatasetPanel
            dataset={dataset}
            key={dataset.id}
            onChange={updateDataset}
          />
        ))}
      </div>
      {comparison ? (
        <ComparisonPanel
          leftOnly={comparison.leftOnly}
          rightOnly={comparison.rightOnly}
        />
      ) : null}
    </main>
  );
};

export default ArrayComparePage;
