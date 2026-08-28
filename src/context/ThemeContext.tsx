// 主题
import { createContext, useReducer } from "react";
import type { ReactNode } from "react";

// ---------- 1. 类型定义 ----------
type ThemeState = "light" | "dark";
type ThemeAction = { type: "TOGGLE" } | { type: "SET"; payload: ThemeState };
export interface ThemeContextType {
  theme: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
}

// ---------- 2. 创建 Context ----------
// 一个容器用与存放theme和dispatch
export const ThemeContext = createContext<ThemeContextType | null>(null);

// ---------- 3. Reducer ----------
// 负责决定新状态是什么    更新函数
// TOGGLE切換  SET直接设定某个值       
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case "TOGGLE":
      return state === "light" ? "dark" : "light";
    case "SET":
      return action.payload;
    default:
      return state;
  }
};

// ---------- 4. Provider 组件 ----------
// 把数据和操作函数塞进context
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, dispatch] = useReducer(themeReducer, "light");

  return (
    <ThemeContext.Provider value={{ theme, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

