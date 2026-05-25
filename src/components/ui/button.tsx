import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes } from 'react';

import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = ({
  asChild = false,
  className,
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonProps) => {
  const Component = asChild ? Slot : 'button';
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      className={classes}
      {...props}
    />
  );
};
