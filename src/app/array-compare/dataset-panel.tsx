'use client';

import {
  dedupePrimitiveArray,
  describeDuplicate,
  parseJsonArray,
} from '@/lib/array-cleaner';

import { createDataset, resetDerivedDatasetState } from './dataset-state';
import { TreeNode } from './json-tree';
import styles from './page.module.css';
import type { DatasetState, PreparedDataset } from './types';

export const DatasetPanel = ({
  dataset,
  onChange,
}: {
  dataset: PreparedDataset;
  onChange: (nextDataset: DatasetState) => void;
}) => {
  const datasetClassName = [
    styles.dataset,
    dataset.fields.length > 0 ? styles.withFields : '',
    dataset.activeItems ? styles.withResult : '',
  ]
    .filter(Boolean)
    .join(' ');

  const updateDataset = (nextDataset: DatasetState) => {
    onChange(nextDataset);
  };

  const handleParse = () => {
    try {
      const nextItems = parseJsonArray(dataset.sourceText);

      updateDataset({
        ...dataset,
        asPrimitive: false,
        checkedDuplicates: false,
        compareSelected: false,
        dedupedItems: null,
        error: '',
        parsedItems: nextItems,
        selectedFields: [],
      });
    } catch (parseError) {
      updateDataset({
        ...dataset,
        asPrimitive: false,
        checkedDuplicates: false,
        compareSelected: false,
        dedupedItems: null,
        error:
          parseError instanceof Error
            ? parseError.message
            : 'JSON parse failed',
        parsedItems: null,
        selectedFields: [],
      });
    }
  };

  const handleClear = () => {
    updateDataset(createDataset(dataset.id));
  };

  const handleFieldToggle = (field: string) => {
    const nextFields = dataset.selectedFields.includes(field)
      ? dataset.selectedFields.filter((currentField) => currentField !== field)
      : [...dataset.selectedFields, field];

    updateDataset(
      resetDerivedDatasetState({
        ...dataset,
        asPrimitive: nextFields.length === 1 ? dataset.asPrimitive : false,
        selectedFields: nextFields,
      }),
    );
  };

  const handlePrimitiveToggle = () => {
    updateDataset(
      resetDerivedDatasetState({
        ...dataset,
        asPrimitive: !dataset.asPrimitive,
      }),
    );
  };

  const handleCheckAndDedupe = () => {
    if (!dataset.cleanedItems) {
      return;
    }

    updateDataset({
      ...dataset,
      checkedDuplicates: true,
      dedupedItems: dedupePrimitiveArray(dataset.cleanedItems),
    });
  };

  const handleCompareToggle = () => {
    updateDataset({
      ...dataset,
      compareSelected: !dataset.compareSelected,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dataset.output);
      updateDataset({
        ...dataset,
        error: '',
      });
    } catch {
      updateDataset({
        ...dataset,
        error: 'Copy failed',
      });
    }
  };

  return (
    <section className={datasetClassName}>
      <div className={styles.inputPane}>
        <div className={styles.panel}>
          <textarea
            aria-label={`JSON array input ${dataset.id}`}
            className={styles.textarea}
            value={dataset.sourceText}
            onChange={(event) =>
              updateDataset({
                ...dataset,
                sourceText: event.target.value,
              })
            }
          />
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleParse}
          >
            解析
          </button>
          <button
            type="button"
            onClick={handleClear}
          >
            清空
          </button>
        </div>
        {dataset.error ? <p className={styles.error}>{dataset.error}</p> : null}
      </div>

      {dataset.fields.length > 0 ? (
        <div className={styles.fieldsPane}>
          <div className={`${styles.panel} ${styles.fields}`}>
            {dataset.fields.map((field, index) => (
              <label
                htmlFor={`field-${dataset.id}-${index}`}
                key={field}
              >
                <input
                  id={`field-${dataset.id}-${index}`}
                  checked={dataset.selectedFields.includes(field)}
                  type="checkbox"
                  onChange={() => handleFieldToggle(field)}
                />
                <span>{field}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {dataset.activeItems ? (
        <div className={styles.treePane}>
          <ul className={styles.tree}>
            <TreeNode
              defaultExpanded
              name="$"
              path={`$-${dataset.id}`}
              value={dataset.activeItems}
            />
          </ul>
          <div className={styles.stats}>
            <span>总数 {dataset.cleanedItems?.length ?? 0}</span>
            {dataset.checkedDuplicates ? (
              <span>重复 {dataset.duplicates.length}</span>
            ) : null}
            {dataset.dedupedItems ? (
              <span>去重后 {dataset.dedupedItems.length}</span>
            ) : null}
          </div>
          {dataset.checkedDuplicates ? (
            <div className={styles.duplicates}>
              {dataset.duplicates.length > 0
                ? dataset.duplicates.map((duplicate) => (
                    <span key={duplicate.key}>
                      {describeDuplicate(duplicate)}
                    </span>
                  ))
                : '无重复'}
            </div>
          ) : null}
          <div className={styles.actions}>
            {dataset.selectedFields.length === 1 ? (
              <label
                className={styles.toggle}
                htmlFor={`as-primitive-${dataset.id}`}
              >
                <input
                  id={`as-primitive-${dataset.id}`}
                  checked={dataset.asPrimitive}
                  type="checkbox"
                  onChange={handlePrimitiveToggle}
                />
                <span>转为直接量</span>
              </label>
            ) : null}
            {dataset.canUsePrimitiveTools ? (
              <button
                type="button"
                onClick={handleCheckAndDedupe}
              >
                查重去重
              </button>
            ) : null}
            {dataset.canCompare ? (
              <label
                className={styles.toggle}
                htmlFor={`compare-${dataset.id}`}
              >
                <input
                  id={`compare-${dataset.id}`}
                  checked={dataset.compareSelected}
                  type="checkbox"
                  onChange={handleCompareToggle}
                />
                <span>参与对比</span>
              </label>
            ) : null}
            <button
              type="button"
              onClick={handleCopy}
            >
              复制结果
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
