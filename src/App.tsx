// src/App.tsx
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import MoodFeed from "./pages/MoodFeed";
import Cart from "./pages/Cart";
import { useTheme } from "./hooks/useTheme";
import { CartProvider } from "./context/CartContext"; // 👈 新增

function App() {
  const { theme, dispatch } = useTheme();

  const bgColor = theme === "dark" ? "#0f172a" : "#f8fafc";
  const textColor = theme === "dark" ? "#f1f5f9" : "#0f172a";
  const navBg = theme === "dark" ? "#1e293b" : "#ffffff";
  const linkColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const linkActiveColor = theme === "dark" ? "#60a5fa" : "#3b82f6";

  return (
    <CartProvider>
      {" "}
      {/* 👈 包裹整个应用，让所有子路由都能访问购物车 */}
      <BrowserRouter basename="/MoodFeed">
        <div
          style={{
            minHeight: "100vh",
            background: bgColor,
            color: textColor,
            padding: "20px",
            fontFamily: "sans-serif",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          {/* 导航栏（不变） */}
          <nav
            style={{
              background: navBg,
              padding: "12px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow:
                theme === "dark"
                  ? "0 2px 8px rgba(0,0,0,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "background 0.3s",
            }}
          >
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <NavLink
                to="/about"
                style={({ isActive }) => ({
                  color: isActive ? linkActiveColor : linkColor,
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                关于
              </NavLink>
              <NavLink
                to="/"
                style={({ isActive }) => ({
                  color: isActive ? linkActiveColor : linkColor,
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                情绪粒子
              </NavLink>
              <NavLink
                to="/home"
                style={({ isActive }) => ({
                  color: isActive ? linkActiveColor : linkColor,
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                任务看板
              </NavLink>
              <NavLink
                to="/cart"
                style={({ isActive }) => ({
                  color: isActive ? linkActiveColor : linkColor,
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                })}
              >
                🛒 购物车
              </NavLink>
            </div>
            <button
              onClick={() => dispatch({ type: "TOGGLE" })}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: theme === "dark" ? "#334155" : "#e2e8f0",
                color: theme === "dark" ? "#f1f5f9" : "#0f172a",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.3s, color 0.3s",
              }}
            >
              {theme === "dark" ? "☀️ 亮色" : "🌙 暗色"}
            </button>
          </nav>

          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/" element={<MoodFeed />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
