// 任务面板的增删改查
import { useState, useEffect, useCallback } from "react";

interface Task {
  id: number;
  text: string;
  done: boolean;
}

// 定义LocalStorage的键名
const STORAGE_KEY = "taskBoardData";

// 初始化函数：从缓存读取数据
const getInitialTasks = (): Task[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("读取本地数据失败，使用默认数据", e);
    }
  }
  return [
    { id: 1, text: "📌 试试拖拽排序", done: false },
    { id: 2, text: "✅ 点击图标切换状态", done: false },
  ];
};

export function useTasks() {
  // 使用getInitialTasks初始化
  const [tasks,setTasks] = useState<Task[]>(getInitialTasks);

  // 每当tasks变化，存入Local
  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));
  },[tasks])

  // 添加任务（用 useCallback 缓存，依赖为空因为用了函数式更新）
  const addTask = useCallback((text: string) => {
    if (text.trim() === "") return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: text.trim(), done: false },
    ]);
  }, []);

  // 删除任务（用 useCallback 缓存）
  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  // 🆕 切换完成状态（核心新增）
  const toggleTask = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }, []);

  //重新排序任务
  const reorderTasks = useCallback((startIndex: number, endIndex: number) => {
    setTasks((prev) => {
      const result = [...prev];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // AI任务生成
  const generateAndAddTasks = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    // ----- 1. 尝试调用真实 API（如果配置了 Key） -----
    const apiKey =
      import.meta.env.VITE_SILICONFLOW_API_KEY ||
      import.meta.env.VITE_DEEPSEEK_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          "https://api.siliconflow.cn/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "Qwen/Qwen2.5-7B-Instruct",
              messages: [
                {
                  role: "system",
                  content: `你是一个任务拆解专家。请根据用户输入的主题，生成 3 到 5 条具体的、可执行的子任务。
                       必须以 JSON 格式返回，格式为：{"tasks": ["子任务1", "子任务2", ...]}。
                       不要包含任何其他解释文字，只返回 JSON。`,
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const content =
            data.choices?.[0]?.message?.content || '{"tasks": []}';
          const parsed = JSON.parse(content);
          if (
            parsed.tasks &&
            Array.isArray(parsed.tasks) &&
            parsed.tasks.length > 0
          ) {
            const newTasks: Task[] = parsed.tasks.map(
              (text: string, index: number) => ({
                id: Date.now() + index,
                text: text,
                done: false,
              }),
            );
            setTasks((prev) => [...prev, ...newTasks]);
            return; // 成功后直接退出
          }
        }
      } catch (error) {
        console.warn("API 调用失败，使用备选静态数据", error);
      }
    }

    // ----- 2. 备选方案：根据关键词生成静态子任务（无需网络） -----
    const generateStaticTasks = (input: string): string[] => {
      const lower = input.toLowerCase();
      // 根据输入匹配预设模板
      if (
        lower.includes("汇报") ||
        lower.includes("ppt") ||
        lower.includes("演讲")
      ) {
        return [
          "📊 汇总关键数据与成果",
          "📝 提炼核心观点与亮点",
          "🎨 设计逻辑清晰的框架",
          "🗣️ 撰写逐字稿并排练",
          "🔍 复查内容并优化排版",
        ];
      }
      if (
        lower.includes("周报") ||
        lower.includes("日报") ||
        lower.includes("月报")
      ) {
        return [
          "📋 梳理本周主要工作内容",
          "📈 量化成果与数据",
          "⚠️ 分析遇到的问题与解决",
          "📅 规划下周重点任务",
          "✉️ 整理成正式汇报格式",
        ];
      }
      if (
        lower.includes("学习") ||
        lower.includes("课程") ||
        lower.includes("教程")
      ) {
        return [
          "📖 明确学习目标与时间安排",
          "🔍 搜集相关学习资料",
          "📝 制定详细学习计划",
          "💻 动手实践每个知识点",
          "📝 总结并记录学习笔记",
        ];
      }
      if (
        lower.includes("开发") ||
        lower.includes("代码") ||
        lower.includes("项目")
      ) {
        return [
          "🎯 确定项目需求与范围",
          "📐 设计整体架构",
          "💻 分模块编码实现",
          "🧪 编写测试用例并调试",
          "📦 部署上线并维护",
        ];
      }
      // 默认通用模板
      return [
        `📌 分析并理解「${input}」的核心需求`,
        "🎯 制定详细的执行计划",
        "🛠️ 按优先级拆分具体步骤",
        "✅ 检查并验证每个环节",
        "📝 总结复盘并输出文档",
      ];
    };

    const staticTasks = generateStaticTasks(prompt);
    const newTasks: Task[] = staticTasks.map((text, index) => ({
      id: Date.now() + index,
      text: text,
      done: false,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
  }, []);

  return {
    tasks,
    addTask,
    deleteTask,
    toggleTask,
    generateAndAddTasks,
    reorderTasks,
  };
}
