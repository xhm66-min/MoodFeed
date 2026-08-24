import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import MoodFeed from "./pages/MoodFeed";

function App() {
  return (
    <BrowserRouter basename="/MoodFeed">
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <nav
          style={{
            borderBottom: "1px solid #ccc",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <NavLink
            to="/"
            style={({ isActive }) => ({
              marginRight: "20px",
              textDecoration: "none",
              color: isActive ? "#3b82f6" : "#000",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            关于
          </NavLink>
          <NavLink
            to="/mood"
            style={({ isActive }) => ({
              marginRight: "20px",
              textDecoration: "none",
              color: isActive ? "#3b82f6" : "#000",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            情绪粒子
          </NavLink>
          <NavLink
            to="/home"
            style={({ isActive }) => ({
              marginRight: "20px",
              textDecoration: "none",
              color: isActive ? "#3b82f6" : "#000",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            任务看板
          </NavLink>
        </nav>

        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<About />} />
          <Route path="/mood" element={<MoodFeed />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
