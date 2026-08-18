import { useState, useRef, useEffect } from "react";

// 粒子对象
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseColor: string;
  // 构造函数：初始化属性
  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 4 + 2;
    this.baseColor = "#888";
  }
  //   方法
  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > canvasWidth || this.x < 0) this.vx *= -1;
    if (this.y > canvasHeight || this.y < 0) this.vy *= -1;
  }
}

function MoodFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moodLabel, setMoodLabel] = useState("等待输入...");

  // 存储粒子和动画帧 ID
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const colorRef = useRef<string>("#888");
  const speedRef = useRef<number>(0.5);

  // 初始化粒子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        // 重置粒子
        particlesRef.current = Array.from(
          { length: 100 },
          () => new Particle(canvas.width, canvas.height),
        );
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 动画循环
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (const p of particles) {
        p.update(canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = colorRef.current;
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 核心：更新粒子颜色和速度（模拟情绪变化）
  const updateMood = (valence: number, arousal: number) => {
    // valence: -1(消极) ~ 1(积极)
    // arousal: 0(平静) ~ 1(激动)

    // 1. 改变颜色：根据 Valence 从 红(消极) -> 灰(中性) -> 蓝(积极)
    let r, g, b;
    if (valence < 0) {
      const intensity = Math.abs(valence);
      r = 100 + 155 * intensity;
      g = 100 - 80 * intensity;
      b = 100 - 80 * intensity;
    } else {
      const intensity = valence;
      r = 100 - 80 * intensity;
      g = 100 - 20 * intensity;
      b = 100 + 155 * intensity;
    }
    colorRef.current = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;

    // 2. 改变速度：根据 Arousal 调整粒子的移动幅度
    speedRef.current = 0.3 + arousal * 2.0;
    particlesRef.current.forEach((p) => {
      // 只调整速度方向，不丢失动量
      const angle = Math.atan2(p.vy, p.vx);
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      // 限制最大速度，防止飞出宇宙
      const targetSpeed = Math.min(speedRef.current, 2.5);
      if (currentSpeed === 0) {
        p.vx = (Math.random() - 0.5) * targetSpeed;
        p.vy = (Math.random() - 0.5) * targetSpeed;
      } else {
        const ratio = targetSpeed / currentSpeed;
        p.vx *= ratio * 1.02;
        p.vy *= ratio * 1.02;
      }
    });

    // 更新文字标签
    let label = "";
    if (valence > 0.3 && arousal > 0.5) label = "兴奋愉悦 🎉";
    else if (valence > 0.3 && arousal <= 0.5) label = "平静满足 😌";
    else if (valence <= 0.3 && valence > -0.3) label = "中性平静 😐";
    else if (valence <= -0.3 && arousal > 0.5) label = "焦虑愤怒 😡";
    else if (valence <= -0.3 && arousal <= 0.5) label = "忧郁低沉 😔";
    setMoodLabel(label);
  };

  // 模拟 AI 分析（点击按钮触发）
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert("请先输入一段文字！");
      return;
    }
    setIsAnalyzing(true);

    // 模拟异步延迟（将来这里替换为真实的 API 调用）
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 模拟根据输入文本生成随机的情绪值（为了演示视觉变化）
    // 真实接入时，这里会调用大模型返回具体数值
    const mockValence = Math.random() * 2 - 1; // -1 ~ 1
    const mockArousal = Math.random(); // 0 ~ 1

    updateMood(mockValence, mockArousal);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🌊 情绪粒子记录仪</h2>
        <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
          {isAnalyzing ? "⏳ 思考中..." : moodLabel}
        </span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* 左侧：输入区 */}
        <div className="lg:w-1/3 flex flex-col gap-3">
          <textarea
            className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none min-h-[200px]"
            placeholder="输入今天看到的视频、听到的笑话、写的日记...&#10;例如：刚刚看了一部关于宇宙的纪录片，感觉人类好渺小。"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? "⏳ 分析中..." : "✨ 分析情绪并启动粒子"}
          </button>
          <p className="text-xs text-gray-400">
            💡 点击按钮将触发粒子颜色和速度变化，模拟 AI 对情绪的理解。
          </p>
        </div>

        {/* 右侧：画布（粒子舞台） */}
        <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative min-h-[300px]">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            100 个情绪粒子
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodFeed;
