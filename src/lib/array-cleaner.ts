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

export const pickObjectFields = (
  items: JsonArray,
  fields: string[],
): JsonArray => {
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

export const toPrimitiveArray = (
  items: JsonArray,
  field: string,
): JsonArray =>
  items.map((item) => {
    if (!isPlainObject(item)) {
      return item;
    }

    return Object.prototype.hasOwnProperty.call(item, field)
      ? item[field]
      : null;
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

export const formatJson = (value: JsonValue): string =>
  JSON.stringify(value, null, 2);
