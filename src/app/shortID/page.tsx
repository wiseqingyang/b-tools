'use client';

import { useRef, useState } from 'react';
import Sqids from 'sqids';

import styles from './index.module.scss';

const Page = () => {
  const decoder = useRef(
    new Sqids({
      minLength: 10,
    }),
  );

  const [output, setOutput] = useState('');

  return (
    <div className={styles.pageContainer}>
      <h1>短ID生成</h1>
      <div className={styles.formContainer}>
        <div className={styles.formRow}>
          <label>输入ID</label>
          <input
            id="input"
            type="text"
            onChange={(e) => {
              const input = e.target.value;
              const output = decoder.current.encode([parseInt(input, 10)]);
              setOutput(output);
            }}
          />
        </div>
        <div className={styles.formRow}>
          <label>输出:</label>
          <div>{output}</div>
        </div>
      </div>
    </div>
  );
};

export default Page;
