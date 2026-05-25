import 'bulma';

import Link from 'next/link';

import styles from './page.module.css';

export default function Home() {
  console.log('styles', styles);
  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        <Link
          href="/lottie"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>Lottie 工具</h2>
          <p>自动将 Lottie 中的图片文件转为 base64 </p>
        </Link>
        <Link
          href="/shortID"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>短Id 生成</h2>
          <p>缩短ID</p>
        </Link>
      </div>
    </main>
  );
}
