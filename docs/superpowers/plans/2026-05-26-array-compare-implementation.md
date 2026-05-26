# Array Compare Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/array-compare` as a focused single-array cleaning tool with top-level field picking, primitive conversion, duplicate detection, dedupe, JSON output, and tree preview.

**Architecture:** Put the data cleaning pipeline in small pure TypeScript helpers, test those helpers with Node's built-in test runner, then wire them into a client route component. Keep the route UI minimal and functional, with no instructional or decorative content.

**Tech Stack:** Next.js App Router, React 18, TypeScript, CSS modules, Node `node:test`, TypeScript compiler for test builds.

---

## File Structure

- Create `src/lib/array-cleaner.ts`: pure parsing, field, duplicate, dedupe, and formatting helpers.
- Create `tests/array-cleaner.test.ts`: Node test coverage for helper behavior.
- Create `tsconfig.test.json`: compiles helpers and tests to `.test-build` for `node --test`.
- Modify `.gitignore`: ignore `.test-build`.
- Modify `package.json`: add `test` script.
- Create `src/app/array-compare/page.tsx`: client page for the tool.
- Create `src/app/array-compare/page.module.css`: route-specific functional layout and controls.
- Modify `src/app/page.tsx`: add homepage entry linking to `/array-compare`.
- Modify `src/app/page.module.css`: make homepage tool cards link-friendly if needed.

## Task 1: Test Harness And Cleaner Helper Red Tests

**Files:**
- Create: `src/lib/array-cleaner.ts`
- Create: `tests/array-cleaner.test.ts`
- Create: `tsconfig.test.json`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Add test script and test compiler config**

Add this script to `package.json`:

```json
"test": "tsc -p tsconfig.test.json && node --test .test-build/tests/array-cleaner.test.js"
```

Create `tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "allowJs": false,
    "isolatedModules": false,
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmit": false,
    "outDir": ".test-build",
    "target": "es2020",
    "types": ["node"]
  },
  "include": ["src/lib/**/*.ts", "tests/**/*.ts"]
}
```

Add `.test-build` under the testing section in `.gitignore`.

- [ ] **Step 2: Add failing helper tests**

Create `tests/array-cleaner.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectTopLevelKeys,
  dedupePrimitiveArray,
  findDuplicates,
  formatJson,
  parseJsonArray,
  pickObjectFields,
  toPrimitiveArray,
} from '../src/lib/array-cleaner';

test('parseJsonArray parses valid arrays', () => {
  assert.deepEqual(parseJsonArray('[{"id":1},"x"]'), [{ id: 1 }, 'x']);
});

test('parseJsonArray rejects invalid JSON', () => {
  assert.throws(() => parseJsonArray('[1,'), /JSON parse failed/);
});

test('parseJsonArray rejects non-array JSON', () => {
  assert.throws(() => parseJsonArray('{"id":1}'), /Input must be a JSON array/);
});

test('collectTopLevelKeys returns object keys in first-seen order', () => {
  assert.deepEqual(
    collectTopLevelKeys([{ id: 1, name: 'A' }, 'x', { name: 'B', age: 2 }]),
    ['id', 'name', 'age'],
  );
});

test('pickObjectFields keeps selected fields and leaves primitive items unchanged', () => {
  assert.deepEqual(
    pickObjectFields([{ id: 1, name: 'A' }, 'x', { id: 2, age: 3 }], ['id']),
    [{ id: 1 }, 'x', { id: 2 }],
  );
});

test('toPrimitiveArray converts object items by field and uses null for missing fields', () => {
  assert.deepEqual(
    toPrimitiveArray([{ id: 1 }, 'x', { name: 'B' }, { id: '1' }], 'id'),
    [1, 'x', null, '1'],
  );
});

test('findDuplicates treats values with the same string form as duplicates', () => {
  assert.deepEqual(findDuplicates([1, '1', null, null, 'x']), [
    { key: '1', value: 1, count: 2 },
    { key: 'null', value: null, count: 2 },
  ]);
});

test('dedupePrimitiveArray preserves first occurrence order by string identity', () => {
  assert.deepEqual(dedupePrimitiveArray([1, '1', null, null, 'x']), [1, null, 'x']);
});

test('formatJson returns pretty JSON', () => {
  assert.equal(formatJson([{ id: 1 }]), '[\n  {\n    "id": 1\n  }\n]');
});
```

- [ ] **Step 3: Add temporary empty helper module**

Create `src/lib/array-cleaner.ts` with no exports:

```ts
export {};
```

- [ ] **Step 4: Run tests to verify red**

Run:

```bash
npm test
```

Expected: FAIL because `src/lib/array-cleaner.ts` does not export the helper functions.

## Task 2: Implement Cleaner Helpers

**Files:**
- Modify: `src/lib/array-cleaner.ts`
- Test: `tests/array-cleaner.test.ts`

- [ ] **Step 1: Implement the helper module**

Replace `src/lib/array-cleaner.ts` with:

```ts
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface DuplicateEntry {
  key: string;
  value: JsonValue;
  count: number;
}

const isPlainObject = (value: JsonValue): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseJsonArray = (sourceText: string): JsonArray => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(sourceText);
  } catch {
    throw new Error('JSON parse failed');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Input must be a JSON array');
  }

  return parsed as JsonArray;
};

export const collectTopLevelKeys = (items: JsonArray): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();

  items.forEach((item) => {
    if (!isPlainObject(item)) {
      return;
    }

    Object.keys(item).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    });
  });

  return keys;
};

export const pickObjectFields = (items: JsonArray, fields: string[]): JsonArray => {
  if (fields.length === 0) {
    return items;
  }

  return items.map((item) => {
    if (!isPlainObject(item)) {
      return item;
    }

    return fields.reduce<JsonObject>((picked, field) => {
      if (Object.prototype.hasOwnProperty.call(item, field)) {
        picked[field] = item[field];
      }

      return picked;
    }, {});
  });
};

export const toPrimitiveArray = (items: JsonArray, field: string): JsonArray =>
  items.map((item) => {
    if (!isPlainObject(item)) {
      return item;
    }

    return Object.prototype.hasOwnProperty.call(item, field) ? item[field] : null;
  });

export const findDuplicates = (items: JsonArray): DuplicateEntry[] => {
  const entries = new Map<string, { value: JsonValue; count: number }>();

  items.forEach((item) => {
    const key = String(item);
    const existing = entries.get(key);

    if (existing) {
      existing.count += 1;
      return;
    }

    entries.set(key, { value: item, count: 1 });
  });

  return Array.from(entries.entries())
    .filter(([, entry]) => entry.count > 1)
    .map(([key, entry]) => ({
      key,
      value: entry.value,
      count: entry.count,
    }));
};

export const dedupePrimitiveArray = (items: JsonArray): JsonArray => {
  const seen = new Set<string>();
  const deduped: JsonArray = [];

  items.forEach((item) => {
    const key = String(item);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

export const formatJson = (value: JsonValue): string => JSON.stringify(value, null, 2);
```

- [ ] **Step 2: Run tests to verify green**

Run:

```bash
npm test
```

Expected: PASS for all helper tests.

- [ ] **Step 3: Commit helper work**

Run:

```bash
git add .gitignore package.json tsconfig.test.json src/lib/array-cleaner.ts tests/array-cleaner.test.ts
git commit -m "feat: add array cleaner helpers"
```

## Task 3: Build The Minimal Array Compare Route UI

**Files:**
- Create: `src/app/array-compare/page.tsx`
- Create: `src/app/array-compare/page.module.css`

- [ ] **Step 1: Create the client route component**

Create `src/app/array-compare/page.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';

import {
  collectTopLevelKeys,
  dedupePrimitiveArray,
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

const sampleInput = '';

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
        <span className={styles.treeValue}>{valueLabel(value)}</span>
        <span className={styles.treeType}>{value === null ? 'null' : typeof value}</span>
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
        <span className={styles.treeType}>{Array.isArray(value) ? 'array' : 'object'}</span>
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
  const [sourceText, setSourceText] = useState(sampleInput);
  const [parsedItems, setParsedItems] = useState<JsonArray | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [asPrimitive, setAsPrimitive] = useState(false);
  const [dedupedItems, setDedupedItems] = useState<JsonArray | null>(null);
  const [duplicateMode, setDuplicateMode] = useState(false);
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
    () => (duplicateMode && cleanedItems ? findDuplicates(cleanedItems) : []),
    [cleanedItems, duplicateMode],
  );
  const output = activeItems ? formatJson(activeItems) : '';

  const resetDerived = () => {
    setDedupedItems(null);
    setDuplicateMode(false);
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
      setError(parseError instanceof Error ? parseError.message : 'JSON parse failed');
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
    setSelectedFields((current) => {
      const nextFields = current.includes(field)
        ? current.filter((currentField) => currentField !== field)
        : [...current, field];

      if (nextFields.length !== 1) {
        setAsPrimitive(false);
      }

      return nextFields;
    });
    resetDerived();
  };

  const handlePrimitiveToggle = () => {
    setAsPrimitive((current) => !current);
    resetDerived();
  };

  const handleDedupe = () => {
    if (!cleanedItems) {
      return;
    }

    setDedupedItems(dedupePrimitiveArray(cleanedItems));
    setDuplicateMode(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setError('');
    } catch {
      setError('Copy failed');
    }
  };

  const canUsePrimitiveTools = asPrimitive && selectedFields.length === 1 && Boolean(cleanedItems);

  return (
    <main className={styles.main}>
      <section className={styles.inputPane}>
        <textarea
          className={styles.textarea}
          aria-label="JSON array input"
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
        />
        <div className={styles.actions}>
          <button type="button" onClick={handleParse}>解析</button>
          <button type="button" onClick={handleClear}>清空</button>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {fields.length > 0 ? (
          <div className={styles.fields}>
            {fields.map((field) => (
              <label key={field}>
                <input
                  checked={selectedFields.includes(field)}
                  type="checkbox"
                  onChange={() => handleFieldToggle(field)}
                />
                <span>{field}</span>
              </label>
            ))}
          </div>
        ) : null}
        {selectedFields.length === 1 ? (
          <label className={styles.toggle}>
            <input
              checked={asPrimitive}
              type="checkbox"
              onChange={handlePrimitiveToggle}
            />
            <span>转为直接量</span>
          </label>
        ) : null}
        {canUsePrimitiveTools ? (
          <div className={styles.actions}>
            <button type="button" onClick={() => setDuplicateMode(true)}>查重</button>
            <button type="button" onClick={handleDedupe}>去重</button>
          </div>
        ) : null}
      </section>

      <section className={styles.outputPane}>
        {activeItems ? (
          <>
            <div className={styles.actions}>
              <button type="button" onClick={handleCopy}>复制结果</button>
            </div>
            <textarea
              className={styles.textarea}
              aria-label="JSON result output"
              readOnly
              value={output}
            />
            <div className={styles.stats}>
              <span>总数 {cleanedItems?.length ?? 0}</span>
              {duplicateMode ? <span>重复 {duplicates.length}</span> : null}
              {dedupedItems ? <span>去重后 {dedupedItems.length}</span> : null}
            </div>
            <ul className={styles.tree}>
              <TreeNode name="$" path="$" value={activeItems} />
            </ul>
          </>
        ) : null}
      </section>
    </main>
  );
};

export default ArrayComparePage;
```

- [ ] **Step 2: Add route CSS**

Create `src/app/array-compare/page.module.css`:

```css
.main {
  display: grid;
  width: 100%;
  max-width: var(--container-page);
  min-height: 100vh;
  margin: 0 auto;
  padding: var(--space-4);
  gap: var(--space-4);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.inputPane,
.outputPane {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: var(--space-3);
}

.textarea {
  width: 100%;
  min-height: 280px;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  padding: var(--space-3);
}

.textarea:focus {
  border-color: var(--primary);
  outline: 3px solid color-mix(in srgb, var(--primary) 18%, transparent);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.actions button {
  min-height: var(--control-height-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--fg);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  padding: 0 var(--space-3);
}

.actions button:hover {
  background: var(--muted);
}

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.fields label,
.toggle {
  display: inline-flex;
  min-height: var(--control-height-sm);
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-3);
  font-size: var(--font-size-sm);
}

.error {
  color: var(--danger);
  font-size: var(--font-size-sm);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--muted-fg);
  font-size: var(--font-size-sm);
}

.tree {
  overflow: auto;
  max-height: 420px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  list-style: none;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.treeGroup {
  margin-left: var(--space-4);
  list-style: none;
}

.treeLine,
.treeToggle {
  display: flex;
  width: 100%;
  min-height: 28px;
  align-items: center;
  gap: var(--space-2);
}

.treeToggle {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.treeName {
  color: var(--primary);
}

.treeValue {
  overflow-wrap: anywhere;
}

.treeType {
  color: var(--muted-fg);
  font-size: var(--font-size-xs);
}

@media (max-width: 800px) {
  .main {
    grid-template-columns: 1fr;
  }

  .textarea {
    min-height: 220px;
  }
}
```

- [ ] **Step 3: Run build checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0. Fix type, lint, or build errors before continuing.

## Task 4: Add Homepage Entry

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.module.css`

- [ ] **Step 1: Add route metadata to tool list**

Update the `tools` array in `src/app/page.tsx` so each tool has an `href`, and add the array compare entry:

```ts
const tools = [
  {
    name: '数组对比工具',
    description: 'JSON array cleaning and comparison workspace.',
    status: 'Ready',
    href: '/array-compare',
  },
  {
    name: 'Link Cleaner',
    description: 'Normalize shared links and remove noisy tracking params.',
    status: 'Ready',
    href: '#',
  },
  {
    name: 'Text Formatter',
    description: 'Trim, sort, compare, and reshape text snippets.',
    status: 'Draft',
    href: '#',
  },
  {
    name: 'Payload Viewer',
    description: 'Inspect JSON payloads with readable spacing and structure.',
    status: 'Draft',
    href: '#',
  },
];
```

Render each tool card as an anchor:

```tsx
{tools.map((tool) => (
  <a
    className={styles.toolCard}
    href={tool.href}
    key={tool.name}
  >
    <div className={styles.toolHeader}>
      <h2>{tool.name}</h2>
      <span>{tool.status}</span>
    </div>
    <p>{tool.description}</p>
  </a>
))}
```

- [ ] **Step 2: Keep linked cards visually stable**

In `src/app/page.module.css`, ensure `.toolCard` works as an anchor:

```css
.toolCard {
  display: block;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.toolCard:hover {
  border-color: color-mix(in srgb, var(--primary) 36%, var(--border));
}
```

- [ ] **Step 3: Run checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit route and homepage work**

Run:

```bash
git add src/app/array-compare src/app/page.tsx src/app/page.module.css
git commit -m "feat: add array compare route"
```

## Task 5: Browser Verification And Polish

**Files:**
- Modify if needed: `src/app/array-compare/page.tsx`
- Modify if needed: `src/app/array-compare/page.module.css`

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Next dev server starts and prints a local URL.

- [ ] **Step 2: Verify `/array-compare` manually**

Open `/array-compare` and test this input:

```json
[
  { "id": 1, "name": "A" },
  { "id": "1", "name": "B" },
  { "name": "C" },
  "free"
]
```

Expected:

- Initial page shows only input and parse/clear controls.
- After parsing, field checkboxes show `id` and `name`.
- Selecting `id` enables `转为直接量`.
- Converting to primitive output shows `[1, "1", null, "free"]`.
- `查重` shows `重复 1`.
- `去重` output shows `[1, null, "free"]`.
- Tree view expands and collapses without layout breakage.

- [ ] **Step 3: Verify mobile layout**

Inspect around 390px width.

Expected:

- Page is single column.
- Textareas fit viewport width.
- Buttons wrap without overlap.
- Tree content scrolls instead of overflowing horizontally.

- [ ] **Step 4: Run final verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit polish if edits were needed**

If verification required edits, run:

```bash
git add src/app/array-compare/page.tsx src/app/array-compare/page.module.css
git commit -m "fix: polish array compare tool layout"
```
