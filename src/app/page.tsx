import styles from './page.module.css'
import Link from 'next/link'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        <Link 
          href="/lottie" 
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Lottie 工具
          </h2>
          <p>自动将 Lottie 中的图片文件转为 base64 </p>
        </Link>
      </div>
    </main>
  )
}
