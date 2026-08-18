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

// --- 可拖拽的任务项组件 ---
function SortableTaskItem({
  task,
  onDelete,
  onToggle,
}: {
  task: any;
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
      {...attributes} // 只保留 attributes（辅助功能）
      className="flex items-center gap-3 p-3 mb-2 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
    >
      {/* 🆕 拖拽手柄：只有拖拽这个图标才触发拖拽 */}
      <span
        {...listeners} // 🎯 监听器只放在这里！
        className="cursor-grab text-gray-400 hover:text-gray-600 select-none text-xl leading-none"
      >
        ⠿拖拽
      </span>

      {/* 状态切换（点击正常触发，不干扰拖拽） */}
      <span
        className="text-xl select-none"
        style={{ cursor: "pointer" }}
        onClick={() => onToggle(task.id)}
      >
        {task.done ? "✅" : "⏳"}
      </span>

      <span
        className={`flex-1 cursor-pointer transition-all ${task.done ? "text-gray-400 line-through" : "text-gray-800"}`}
        onClick={() => onToggle(task.id)}
      >
        {task.text}
      </span>

      {/* 删除按钮 */}
      <button
        onClick={() => onDelete(task.id)}
        style={{ cursor: "pointer" }}
        className="text-red-400 hover:text-red-600 transition-colors text-lg font-bold px-2"
      >
        ✕
      </button>
    </li>
  );
}

// --- 主组件 ---
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

  // 配置拖拽传感器（鼠标 + 键盘）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

  // 拖拽结束后的处理：重新排序
  const handleDragEnd = (event: any) => {
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 我的任务看板</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {pendingCount} 项待完成
        </span>
      </div>

      {/* 输入区域 */}
      <div className="flex gap-3 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="输入任务主题，或用 AI 生成..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
        <button
          onClick={handleAdd}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          ➕ 添加
        </button>
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "⏳ 生成中..." : "✨ AI 生成"}
        </button>
        <button
          onClick={() => inputRef.current?.focus()}
          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🔍 聚焦
        </button>
      </div>

      {/* 可拖拽的列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1">
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

      <p className="mt-6 text-xs text-gray-400 border-t border-gray-100 pt-4 text-center">
        💡 拖拽任意任务调整顺序，点击文字切换状态
      </p>
    </div>
  );
}

export default Home;
