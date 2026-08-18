// 1. 从路由库中引入必要的组件
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// 2. 引入刚才建好的两个页面
import Home from './pages/Home';
import About from './pages/About';
import MoodFeed from './pages/MoodFeed';

function App() {
  return (
    // BrowserRouter 是路由的“容器”（对标 Vue 的 createRouter 和 app.use）
    <BrowserRouter>
      {/* 页面整体布局 */}
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        
        {/* ---------- 导航栏（对标 Vue Router 的 <router-link>） ---------- */}
        <nav style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
          {/* Link 标签就是超链接，to= 对应 Vue 的 :to= */}
          <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
            🏠 首页
          </Link>
          <Link to="/about" style={{ marginRight: '20px', textDecoration: 'none' }}>
            📖 关于
          </Link>
          <Link to="/mood" className="...">🌊 情绪粒子</Link>
        </nav>

        {/* ---------- 路由出口（对标 Vue Router 的 <router-view />） ---------- */}
        {/* Routes 会匹配当前 URL，并渲染对应的 Route 里的 element */}
        <Routes>
          {/* path 是路径，element 是对应要显示的组件 */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/mood" element={<MoodFeed />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;