// 历史记录
// 封装了情绪历史记录和增删查逻辑
import { useState, useCallback } from "react";

import { storageService } from "../services/storageService";

export interface EmotionRecord {
  id: string; //类似于
  timestamp: number; //时间
  valence: number; //情绪值
  arousal: number; //唤醒值
  content: string; // 用户输入的原始文本（截取前 50 字）
  markdown: string; // 完整的 AI 报告（可省略，只存前 200 字用于展示）
}

const STORAGE_KEY = "emotion_history";

// 读取历史记录
const loadHistory = (): EmotionRecord[] => {
  return storageService.load<EmotionRecord[]>(STORAGE_KEY) || [];
};

// 保存历史记录
const saveHistory = (records: EmotionRecord[]) => {
  storageService.save(STORAGE_KEY, records);
};

export function useEmotionHistory() {
  const [records, setRecords] = useState<EmotionRecord[]>(loadHistory);

  // 添加一条
  // Omit 从EmotionRecord这个类型里，把ID字段剔除掉，剩下的字段必须全部提供
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
