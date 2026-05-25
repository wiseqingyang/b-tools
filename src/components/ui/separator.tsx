import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type { ComponentPropsWithoutRef } from 'react';

import styles from './separator.module.css';

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

export const Separator = ({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) => {
  const classes = [
    styles.root,
    orientation === 'vertical' ? styles.vertical : styles.horizontal,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SeparatorPrimitive.Root
      className={classes}
      orientation={orientation}
      {...props}
    />
  );
};
