'use client';

import { useMemo, useState } from 'react';

import {
  collectTopLevelKeys,
  dedupePrimitiveArray,
  describeDuplicate,
  findDuplicates,
  formatJson,
  type JsonArray,
  type JsonValue,
  parseJsonArray,
  pickObjectFields,
  toPrimitiveArray,
} from '@/lib/array-cleaner';

import styles from './page.module.css';

type TreePath = string;

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

const TreeNode = ({
  name,
  path,
  value,
}: {
  name: string;
  path: TreePath;
  value: JsonValue;
}) => {
  const [expanded, setExpanded] = useState(path === '$');
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

const ArrayComparePage = () => {
  const [sourceText, setSourceText] = useState('');
  const [parsedItems, setParsedItems] = useState<JsonArray | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [asPrimitive, setAsPrimitive] = useState(false);
  const [dedupedItems, setDedupedItems] = useState<JsonArray | null>(null);
  const [checkedDuplicates, setCheckedDuplicates] = useState(false);
  const [error, setError] = useState('');

  const fields = useMemo(
    () => (parsedItems ? collectTopLevelKeys(parsedItems) : []),
    [parsedItems],
  );

  const cleanedItems = useMemo(() => {
    if (!parsedItems) {
      return null;
    }

    const picked = pickObjectFields(parsedItems, selectedFields);
    const selectedField = selectedFields[0];

    return asPrimitive && selectedFields.length === 1 && selectedField
      ? toPrimitiveArray(picked, selectedField)
      : picked;
  }, [asPrimitive, parsedItems, selectedFields]);

  const activeItems = dedupedItems ?? cleanedItems;
  const duplicates = useMemo(
    () =>
      checkedDuplicates && cleanedItems ? findDuplicates(cleanedItems) : [],
    [checkedDuplicates, cleanedItems],
  );
  const output = activeItems ? formatJson(activeItems) : '';
  const canUsePrimitiveTools =
    asPrimitive && selectedFields.length === 1 && Boolean(cleanedItems);

  const resetDerived = () => {
    setDedupedItems(null);
    setCheckedDuplicates(false);
  };

  const handleParse = () => {
    try {
      const nextItems = parseJsonArray(sourceText);

      setParsedItems(nextItems);
      setSelectedFields([]);
      setAsPrimitive(false);
      resetDerived();
      setError('');
    } catch (parseError) {
      setError(
        parseError instanceof Error ? parseError.message : 'JSON parse failed',
      );
      setParsedItems(null);
      setSelectedFields([]);
      setAsPrimitive(false);
      resetDerived();
    }
  };

  const handleClear = () => {
    setSourceText('');
    setParsedItems(null);
    setSelectedFields([]);
    setAsPrimitive(false);
    resetDerived();
    setError('');
  };

  const handleFieldToggle = (field: string) => {
    const nextFields = selectedFields.includes(field)
      ? selectedFields.filter((currentField) => currentField !== field)
      : [...selectedFields, field];

    setSelectedFields(nextFields);
    setAsPrimitive((current) => (nextFields.length === 1 ? current : false));
    resetDerived();
  };

  const handlePrimitiveToggle = () => {
    setAsPrimitive((current) => !current);
    resetDerived();
  };

  const handleCheckAndDedupe = () => {
    if (!cleanedItems) {
      return;
    }

    setDedupedItems(dedupePrimitiveArray(cleanedItems));
    setCheckedDuplicates(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setError('');
    } catch {
      setError('Copy failed');
    }
  };

  return (
    <main className={styles.main}>
      <section className={styles.inputPane}>
        <div className={styles.panel}>
          <textarea
            aria-label="JSON array input"
            className={styles.textarea}
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
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
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.fieldsPane}>
        {fields.length > 0 ? (
          <div className={`${styles.panel} ${styles.fields}`}>
            {fields.map((field, index) => (
              <label
                htmlFor={`field-${index}`}
                key={field}
              >
                <input
                  id={`field-${index}`}
                  checked={selectedFields.includes(field)}
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
      </section>

      <section className={styles.treePane}>
        {activeItems ? (
          <>
            <ul className={styles.tree}>
              <TreeNode
                name="$"
                path="$"
                value={activeItems}
              />
            </ul>
            <div className={styles.stats}>
              <span>总数 {cleanedItems?.length ?? 0}</span>
              {checkedDuplicates ? <span>重复 {duplicates.length}</span> : null}
              {dedupedItems ? <span>去重后 {dedupedItems.length}</span> : null}
            </div>
            {checkedDuplicates ? (
              <div className={styles.duplicates}>
                {duplicates.length > 0
                  ? duplicates.map((duplicate) => (
                      <span key={duplicate.key}>
                        {describeDuplicate(duplicate)}
                      </span>
                    ))
                  : '无重复'}
              </div>
            ) : null}
            <div className={styles.actions}>
              {selectedFields.length === 1 ? (
                <label
                  className={styles.toggle}
                  htmlFor="as-primitive"
                >
                  <input
                    id="as-primitive"
                    checked={asPrimitive}
                    type="checkbox"
                    onChange={handlePrimitiveToggle}
                  />
                  <span>转为直接量</span>
                </label>
              ) : null}
              {canUsePrimitiveTools ? (
                <button
                  type="button"
                  onClick={handleCheckAndDedupe}
                >
                  查重去重
                </button>
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
      </section>
    </main>
  );
};

export default ArrayComparePage;
