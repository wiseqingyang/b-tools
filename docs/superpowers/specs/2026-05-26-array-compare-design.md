# Array Compare Tool Design

## Scope

Build a new `/array-compare` route for the array compare tool. The first release implements single-array data cleaning only, while keeping the processing model and page structure ready for a future two-array comparison flow.

The UI is for users who already understand the tool. It must not include hero content, onboarding copy, explanatory panels, decorative elements, or non-functional status sections.

## Route And Entry

- Add an independent `/array-compare` route.
- Keep the homepage as the tool directory.
- Add an array compare tool entry on the homepage that links to `/array-compare`.
- The `/array-compare` page is a focused tool surface, not a landing page.

## Page Layout

The page shows only functional controls and outputs.

Initial state:

- JSON input textarea.
- Action row with parse and clear actions.

After successful parse:

- Field selection controls, only when object items expose top-level keys.
- Primitive conversion control, only when exactly one field is selected.
- Duplicate check and dedupe actions, only after converting to primitive values.
- Result output textarea.
- Tree view of the current cleaned data.
- Compact numeric stats, only when data exists.

Desktop layout:

- Two columns.
- Left column: input, parse/clear actions, field controls.
- Right column: result output, copy action, tree view, compact stats.

Mobile layout:

- Single column.
- Order: input, actions, field controls, result output, tree view, stats.

No static instructions or explanatory copy appear in the page. Runtime errors can show a single concise line, such as `JSON parse failed` or `Input must be a JSON array`.

## Data Model

Represent the active dataset with a reusable structure that can later be duplicated for left and right arrays:

- `sourceText`: raw textarea value.
- `parsedItems`: parsed JSON array.
- `selectedFields`: top-level fields selected for object picking.
- `asPrimitive`: whether the selected single field is converted to primitive values.
- `currentItems`: cleaned result currently shown in output and tree view.
- `dedupedItems`: deduped primitive result, when available.
- `duplicateSummary`: duplicate values and counts, when available.

The first release uses one dataset instance. Future comparison can add `leftDataset`, `rightDataset`, and comparison output without rewriting the cleaning pipeline.

## Cleaning Rules

- Input must parse as JSON.
- Parsed value must be an array.
- Array members may be objects or primitive values.
- Object field picking supports top-level keys only.
- Top-level keys are collected from all object items in first-seen order.
- When fields are selected, object items are reduced to those selected fields.
- Primitive array items pass through unchanged when field picking is applied.
- If exactly one field is selected, the user can convert object items to direct values.
- During primitive conversion, missing fields become `null`.
- Primitive conversion keeps array length unchanged.

## Duplicate And Dedupe Rules

Duplicate check and dedupe are available only after primitive conversion.

- Duplicate identity is `String(value)`.
- Number `1` and string `"1"` are duplicates.
- `null` participates as `String(null)`.
- Dedupe keeps the first occurrence and preserves original order.
- Stats include total count, duplicate value count, and deduped count.

## Tree View

The tree view renders the current cleaned data.

- Arrays and objects can be expanded and collapsed.
- The array root is visible.
- Array items are shown by index.
- Object fields are shown by key.
- Primitive values show type and value.
- Field picking and primitive conversion update the tree view immediately.

## Output

The result output textarea always reflects the current cleaned result as formatted JSON.

- Before parsing, output is hidden.
- After parsing, output shows the cleaned result.
- Copy result copies the current output JSON.
- If a deduped result is generated, the output switches to the deduped result.
- Re-parsing or changing field selections resets stale duplicate and dedupe output.

## Error Handling

Errors are concise and attached to the relevant operation.

- Invalid JSON: `JSON parse failed`.
- Parsed value is not an array: `Input must be a JSON array`.
- Copy failure: `Copy failed`.

The UI should avoid verbose remediation text.

## Code Structure

Add pure helpers for the cleaning pipeline:

- `parseJsonArray`
- `collectTopLevelKeys`
- `pickObjectFields`
- `toPrimitiveArray`
- `findDuplicates`
- `dedupePrimitiveArray`
- `formatJson`

Keep helpers separate from the route component so they can be tested without rendering React.

## Tests

Use test-first development for pure helpers.

Required behavior coverage:

- Parses valid JSON arrays.
- Rejects invalid JSON.
- Rejects non-array JSON.
- Collects top-level object keys in first-seen order.
- Picks selected top-level fields from object items.
- Leaves primitive items unchanged during field picking.
- Converts a single selected field to primitive values.
- Uses `null` for missing fields during primitive conversion.
- Treats `1` and `"1"` as duplicates.
- Dedupes primitive values while preserving first occurrence order.

## Verification

Run:

- Helper tests.
- `npm run lint`.
- `npm run build`.

Then start the local dev server and inspect `/array-compare` at desktop and mobile widths to confirm the page contains only functional controls, no explanatory sections, and no overlapping UI.
