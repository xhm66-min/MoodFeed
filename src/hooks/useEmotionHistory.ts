// 历史记录
import { useState, useCallback } from "react";

export interface EmotionRecord {
  id: string;
  timestamp: number;
  valence: number;
  arousal: number;
  content: string; // 用户输入的原始文本（截取前 50 字）
  markdown: string; // 完整的 AI 报告（可省略，只存前 200 字用于展示）
}

const STORAGE_KEY = "emotion_history";

// 读取历史记录
const loadHistory = (): EmotionRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

// 保存历史记录
const saveHistory = (records: EmotionRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export function useEmotionHistory() {
  const [records, setRecords] = useState<EmotionRecord[]>(loadHistory);

  // 添加一条
  const addRecord = useCallback((record: Omit<EmotionRecord, "id">) => {
    const newRecord: EmotionRecord = {
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    };

    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, []);

  //清空历史记录
  const clearHistory = useCallback(() => {
    setRecords([]);
    saveHistory([]);
  }, []);

  return { records, addRecord, clearHistory };
}
