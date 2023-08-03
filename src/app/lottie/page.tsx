'use client';
import { useEffect, useState } from 'react';
import FileInput from "./components/FileInput";
import JsonFormatter from "./components/JsonFormatter";
import styles from './index.module.scss'

const NextPage = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jsonText, setJsonText] = useState<string>('');
  const [picBase64Map, setPicBase64Map] = useState<Record<string, string>>({});

  useEffect(() => {
    selectedFiles.forEach((file) => {
      if (file.name.match(/\.json$/)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result;
          setJsonText(json as string);
        };
        reader.readAsText(file);
      }
    });
    if (selectedFiles.length === 0) {
      setJsonText('');
    }
  }, [selectedFiles]);

  useEffect(() => {
    if (jsonText.length > 0) {
      const lottieObj = JSON.parse(jsonText);
      const { assets } = lottieObj;
      assets.forEach((asset: any) => {
        if (asset.p) {
          const { p } = asset;
          const picName = p.split('/').pop();
          const pic = selectedFiles.find((file) => file.name === picName);
          if (pic) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result;
              setPicBase64Map((prev) => ({ ...prev, [picName]: base64 as string }));
            };
            reader.readAsDataURL(pic);
          }
        }
      })
    }
  }, [jsonText, selectedFiles]);



  return (
    <div className={styles.container} >
      <FileInput files={selectedFiles} onFilesChange={setSelectedFiles}  />
      <JsonFormatter 
        json={jsonText} 
        onCopy={() => {
          const jsonObj = JSON.parse(jsonText);
          jsonObj.assets.forEach((asset: any) => {
            if (asset.p) {
              const { p } = asset;
              const picName = p.split('/').pop();
              const base64 = picBase64Map[picName];
              if (base64) {
                asset.p = base64;
              }
            }
          });
          navigator.clipboard.writeText(JSON.stringify(jsonObj));
          console.log('复制成功', JSON.stringify(jsonObj));
        }} 
      />
    </div>
  );
};

export default NextPage;

