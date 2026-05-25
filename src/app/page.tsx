import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import styles from './page.module.css';

const tools = [
  {
    name: 'Link Cleaner',
    description: 'Normalize shared links and remove noisy tracking params.',
    status: 'Ready',
  },
  {
    name: 'Text Formatter',
    description: 'Trim, sort, compare, and reshape text snippets.',
    status: 'Draft',
  },
  {
    name: 'Payload Viewer',
    description: 'Inspect JSON payloads with readable spacing and structure.',
    status: 'Draft',
  },
];

const Home = () => {
  return (
    <main className={styles.main}>
      <section
        className={styles.hero}
        aria-labelledby="home-title"
      >
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Browser utilities</p>
          <h1
            id="home-title"
            className={styles.title}
          >
            B Tools
          </h1>
          <p className={styles.summary}>
            A compact workspace for the small browser tasks that interrupt
            product and engineering work.
          </p>
          <div className={styles.actions}>
            <Button
              asChild
              size="lg"
            >
              <a href="#tools">View tools</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
            >
              <a
                href="https://github.com"
                rel="noreferrer"
                target="_blank"
              >
                Source
              </a>
            </Button>
          </div>
        </div>

        <aside
          className={styles.panel}
          aria-label="Workspace snapshot"
        >
          <div className={styles.panelHeader}>
            <span>Today</span>
            <strong>3 tools</strong>
          </div>
          <Separator />
          <dl className={styles.metrics}>
            <div>
              <dt>Primary token</dt>
              <dd>#9f4b3f</dd>
            </div>
            <div>
              <dt>Components</dt>
              <dd>Radix primitives</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section
        id="tools"
        className={styles.tools}
        aria-label="Tools"
      >
        {tools.map((tool) => (
          <article
            className={styles.toolCard}
            key={tool.name}
          >
            <div className={styles.toolHeader}>
              <h2>{tool.name}</h2>
              <span>{tool.status}</span>
            </div>
            <p>{tool.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Home;
