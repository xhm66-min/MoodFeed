// src/components/EmotionGraph.tsx
import React, { useEffect, useRef } from 'react';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import type { EmotionRecord } from '../hooks/useEmotionHistory';

interface EmotionGraphProps {
  records: EmotionRecord[];
}

export function EmotionGraph({ records }: EmotionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || records.length < 2) return;

    // 1. 创建节点
    const nodes = new DataSet(
      records.map((r) => ({
        id: r.id,
        label: r.content.length > 10 ? r.content.slice(0, 10) + '…' : r.content,
        title: `${new Date(r.timestamp).toLocaleString()}\nValence: ${r.valence.toFixed(2)}\nArousal: ${r.arousal.toFixed(2)}`,
        color: {
          background: r.valence > 0.3 ? '#3b82f6' : r.valence < -0.3 ? '#ef4444' : '#9ca3af',
          border: '#ffffff',
        },
        size: 15 + Math.abs(r.valence) * 12,
        font: { color: '#ffffff', size: 12 },
        shape: 'dot',
      }))
    );

    // 2. 创建连线：按时间顺序，相邻且情绪极性相似（同为正或同为负）才连线
    const edges = new DataSet();
    for (let i = 0; i < records.length - 1; i++) {
      const cur = records[i];
      const next = records[i + 1];
      const bothPositive = cur.valence > 0.2 && next.valence > 0.2;
      const bothNegative = cur.valence < -0.2 && next.valence < -0.2;
      if (bothPositive || bothNegative) {
        edges.add({
          id: `e-${cur.id}-${next.id}`,
          from: cur.id,
          to: next.id,
          color: 'rgba(255,255,255,0.3)',
          width: 2,
          smooth: { type: 'continuous' },
        });
      }
    }

    // 3. 配置选项（力导向布局）
    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        smooth: true,
      },
      physics: {
        enabled: true, // 开启物理引擎，让节点有“弹性”
        stabilization: { iterations: 100 },
        barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3 },
      },
      interaction: {
        hover: true,//悬停
        tooltipDelay: 100,
        navigationButtons: true,
      },
    };

    // 4. 渲染
    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    // 5. 清理
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [records]);

  if (records.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
        至少需要 2 条记录才能生成图谱
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}