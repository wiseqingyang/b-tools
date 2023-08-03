'use client'
import React, { FC } from 'react';
import styles from './index.module.scss';

interface IProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const FileInput: FC<IProps> = ({ files, onFilesChange}) => {

  const handleDragOver = (event: React.DragEvent<HTMLInputElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLInputElement>) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    onFilesChange(files.concat(Array.from(newFiles)));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files
    if (newFiles) {
      onFilesChange(files.concat(Array.from(newFiles)));
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        multiple
        onChange={handleInputChange}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      <ul className={styles.fileList}>
        {files.map((file, index) => (
          <li key={index}>
            {file.name}
            <button 
              type='button' 
              onClick={() => {
                const newFiles = [...files];
                newFiles.splice(index, 1);
                onFilesChange(newFiles);
              }}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileInput;