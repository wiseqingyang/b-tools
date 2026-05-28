import type { JsonArray } from '@/lib/array-cleaner';

import { TreeNode } from './json-tree';
import styles from './page.module.css';

export const ComparisonPanel = ({
  leftOnly,
  rightOnly,
}: {
  leftOnly: JsonArray;
  rightOnly: JsonArray;
}) => (
  <section className={styles.comparePane}>
    <div className={styles.compareTree}>
      <ul className={styles.tree}>
        <TreeNode
          defaultExpanded
          name="A独有"
          path="$-compare-left"
          value={leftOnly}
        />
      </ul>
    </div>
    <div className={styles.compareTree}>
      <ul className={styles.tree}>
        <TreeNode
          defaultExpanded
          name="B独有"
          path="$-compare-right"
          value={rightOnly}
        />
      </ul>
    </div>
  </section>
);
