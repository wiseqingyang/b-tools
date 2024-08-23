'use client';
import React, { FC, useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', json);
import 'highlight.js/styles/vs.css';
import styles from './index.module.scss';

interface IProps {
  json: string;
  onCopy: () => void;
}

const JsonFormatter: FC<IProps> = ({ json, onCopy }) => {

  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if(json.length > 0) {
      if (codeRef.current) {
        delete codeRef.current.dataset['highlighted'];
      }
      hljs.highlightElement(document.querySelectorAll('.language-json')[0] as HTMLElement)
    }
  }, [json]);

  return (
    <div className={styles.container}>
      <button type='button' onClick={onCopy}>复制</button>
      <pre>
        <code ref={codeRef} className="language-json" contentEditable>        
          {json.length > 0 ? JSON.stringify(JSON.parse(json), null, 2) : '请上传json文件'}
        </code>
      </pre>
    </div> 
  );
};

export default JsonFormatter;