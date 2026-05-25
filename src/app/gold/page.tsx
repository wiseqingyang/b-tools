'use client';

import * as echarts from 'echarts';
import { useEffect } from 'react';

import styles from './index.module.scss';

const Page = () => {
  const salePrice = 609;
  const offPrice = 529;
  const hasPrice = 485;

  const exchangeOff = 0.95;

  useEffect(() => {
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption({
      xAxis: {
        type: 'value',
      },
      yAxis: {
        type: 'value',
      },
      tooltip: {
        trigger: 'axis',
      },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330, 1320],
          type: 'line',
          smooth: true,
        },
      ],
    });
  }, []);
  return (
    <div>
      <div
        id="chart"
        className={styles.chart}
      />
      <div className="field">
        <label className="label">店面金价</label>
        <div className="control">
          <input
            className="input"
            type="text"
            placeholder="店面金价"
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
