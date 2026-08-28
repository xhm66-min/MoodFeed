import { useRef, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../hooks/useTasks";
import type { DragEndEvent } from "@dnd-kit/core";

// --- 可拖拽的任务项组件（仅样式升级） ---
function SortableTaskItem({
  task,
  onDelete,
  onToggle,
}: {
  task: Task;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      // 升级后的卡片样式：更圆润、有阴影、悬停效果
      className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      {/* 拖拽手柄 – 只在这里监听拖拽 */}
      <span
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 select-none text-xl leading-none transition-colors"
      >
        ⠿拖拽
      </span>

      {/* 状态切换图标 */}
      <span
        className="text-xl select-none cursor-pointer"
        onClick={() => onToggle(task.id)}
      >
        {task.done ? "✅" : "⏳"}
      </span>

      {/* 任务文字 */}
      <span
        className={`flex-1 cursor-pointer transition-all text-sm ${
          task.done ? "text-gray-400 line-through" : "text-gray-700"
        }`}
        onClick={() => onToggle(task.id)}
      >
        {task.text}
      </span>

      {/* 删除按钮 – 柔和红 */}
      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-300 hover:text-red-500 transition-colors text-lg font-bold px-2"
      >
        ✕
      </button>
    </li>
  );
}

// --- 主组件（仅样式升级） ---
function Home() {
  const {
    tasks,
    addTask,
    deleteTask,
    toggleTask,
    generateAndAddTasks,
    reorderTasks,
  } = useTasks();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = () => {
    addTask(inputValue);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleAIGenerate = async () => {
    if (!inputValue.trim()) {
      alert("请输入任务主题，让 AI 帮你拆解！");
      return;
    }
    setIsGenerating(true);
    await generateAndAddTasks(inputValue);
    setIsGenerating(false);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      reorderTasks(oldIndex, newIndex);
    }
  };

  const pendingCount = tasks.filter((t) => !t.done).length;

  return (
    // 根容器：卡片化设计，圆角阴影，内边距升级
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-gray-100/80">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          📋 我的任务看板
        </h2>
        <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full shadow-sm shadow-blue-200/50 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
          {pendingCount} 项待完成
        </span>
      </div>

      {/* 输入区域 – 响应式布局（竖排/横排） */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="输入任务主题，或用 AI 生成…"
          className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 outline-none transition-all duration-200 text-gray-700 placeholder:text-gray-400 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm shadow-sm shadow-blue-200/50 hover:shadow-blue-300/50 active:scale-[0.97] flex items-center justify-center gap-1.5"
        >
          ➕ 添加
        </button>
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-200 font-medium text-sm shadow-sm shadow-purple-200/50 hover:shadow-purple-300/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] flex items-center justify-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            "✨ AI 生成"
          )}
        </button>
        <button
          onClick={() => inputRef.current?.focus()}
          className="px-5 py-2.5 bg-white border border-gray-200/80 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-sm shadow-sm active:scale-[0.97] flex items-center justify-center gap-1.5"
        >
          🔍 聚焦
        </button>
      </div>

      {/* 任务列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1.5">
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onDelete={deleteTask}
                onToggle={toggleTask}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {/* 底部提示 */}
      <p className="mt-6 text-xs text-gray-400 border-t border-gray-100/80 pt-4 text-center flex items-center justify-center gap-2">
        <span>💡 拖拽任意任务调整顺序 · 点击文字切换状态</span>
      </p>
    </div>
  );
}

export default Home;