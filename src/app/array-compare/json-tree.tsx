'use client';

import { useState } from 'react';

import type { JsonValue } from '@/lib/array-cleaner';

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

export const TreeNode = ({
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
