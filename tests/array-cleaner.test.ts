import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectTopLevelKeys,
  dedupePrimitiveArray,
  describeDuplicate,
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

test('collectTopLevelKeys returns object keys in ASCII order', () => {
  assert.deepEqual(
    collectTopLevelKeys([{ name: 'A', id: 1 }, 'x', { Age: 2 }]),
    ['Age', 'id', 'name'],
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

test('describeDuplicate formats duplicate count by display value', () => {
  assert.equal(describeDuplicate({ key: '1', value: 1, count: 3 }), '1 重复 3 次');
  assert.equal(
    describeDuplicate({ key: 'null', value: null, count: 2 }),
    'null 重复 2 次',
  );
  assert.equal(
    describeDuplicate({ key: 'x', value: 'x', count: 2 }),
    '"x" 重复 2 次',
  );
});

test('dedupePrimitiveArray preserves first occurrence order by string identity', () => {
  assert.deepEqual(dedupePrimitiveArray([1, '1', null, null, 'x']), [
    1,
    null,
    'x',
  ]);
});

test('formatJson returns pretty JSON', () => {
  assert.equal(formatJson([{ id: 1 }]), '[\n  {\n    "id": 1\n  }\n]');
});
