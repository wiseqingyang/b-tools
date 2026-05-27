'use client';

import { useMemo, useState } from 'react';

import {
  collectTopLevelKeys,
  comparePrimitiveArrays,
  dedupePrimitiveArray,
  describeDuplicate,
  findDuplicates,
  formatJson,
  isPrimitiveArray,
  type JsonArray,
  type JsonValue,
  parseJsonArray,
  pickObjectFields,
  toPrimitiveArray,
} from '@/lib/array-cleaner';

import styles from './page.module.css';

type TreePath = string;

interface DatasetState {
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

interface PreparedDataset extends DatasetState {
  activeItems: JsonArray | null;
  canCompare: boolean;
  canUsePrimitiveTools: boolean;
  cleanedItems: JsonArray | null;
  duplicates: ReturnType<typeof findDuplicates>;
  fields: string[];
  output: string;
}

const createDataset = (id: number): DatasetState => ({
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

const isObject = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const valueLabel = (value: JsonValue) => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
};

const primitiveClassName = (value: JsonValue) => {
  if (value === null) {
    return styles.valueNull;
  }

  if (typeof value === 'string') {
    return styles.valueString;
  }

  if (typeof value === 'number') {
    return styles.valueNumber;
  }

  if (typeof value === 'boolean') {
    return styles.valueBoolean;
  }

  return styles.treeValue;
};

const prepareDataset = (dataset: DatasetState): PreparedDataset => {
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

const TreeNode = ({
  defaultExpanded = false,
  name,
  path,
  value,
}: {
  defaultExpanded?: boolean;
  name: string;
  path: TreePath;
  value: JsonValue;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandable = Array.isArray(value) || isObject(value);

  if (!expandable) {
    return (
      <li className={styles.treeLine}>
        <span className={styles.treeName}>{name}</span>
        <span className={primitiveClassName(value)}>{valueLabel(value)}</span>
      </li>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return (
    <li>
      <button
        className={styles.treeToggle}
        type="button"
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{expanded ? '-' : '+'}</span>
        <span>{name}</span>
        <span className={styles.treeShape}>
          {Array.isArray(value) ? '[]' : '{}'}
        </span>
      </button>
      {expanded ? (
        <ul className={styles.treeGroup}>
          {entries.map(([entryName, entryValue]) => (
            <TreeNode
              key={`${path}.${entryName}`}
              name={entryName}
              path={`${path}.${entryName}`}
              value={entryValue}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const DatasetPanel = ({
  dataset,
  onChange,
}: {
  dataset: PreparedDataset;
  onChange: (nextDataset: DatasetState) => void;
}) => {
  const resetDerived = (nextDataset: DatasetState): DatasetState => ({
    ...nextDataset,
    checkedDuplicates: false,
    compareSelected: false,
    dedupedItems: null,
  });

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
      resetDerived({
        ...dataset,
        asPrimitive: nextFields.length === 1 ? dataset.asPrimitive : false,
        selectedFields: nextFields,
      }),
    );
  };

  const handlePrimitiveToggle = () => {
    updateDataset(
      resetDerived({
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
    <section className={styles.dataset}>
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

      <div className={styles.fieldsPane}>
        {dataset.fields.length > 0 ? (
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
        ) : (
          <div className={styles.panel} />
        )}
      </div>

      <div className={styles.treePane}>
        {dataset.activeItems ? (
          <>
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
          </>
        ) : (
          <ul className={styles.tree} />
        )}
      </div>
    </section>
  );
};

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
        <section className={styles.comparePane}>
          <div className={styles.compareTree}>
            <ul className={styles.tree}>
              <TreeNode
                defaultExpanded
                name="A独有"
                path="$-compare-left"
                value={comparison.leftOnly}
              />
            </ul>
          </div>
          <div className={styles.compareTree}>
            <ul className={styles.tree}>
              <TreeNode
                defaultExpanded
                name="B独有"
                path="$-compare-right"
                value={comparison.rightOnly}
              />
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default ArrayComparePage;
