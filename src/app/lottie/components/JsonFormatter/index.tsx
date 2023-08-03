import React, { FC } from 'react';

import styles from './index.module.scss';
interface IProps {
  json: string;
  onCopy: () => void;
}

const JsonFormatter: FC<IProps> = ({ json, onCopy }) => {
  return (
    <div className={styles.container}>
      <button type='button' onClick={onCopy}>复制</button>
      <pre>
        {json.length > 0 ? JSON.stringify(JSON.parse(json), null, 2) : '请上传json文件'}
      </pre>
    </div> 
  );
};

export default JsonFormatter;