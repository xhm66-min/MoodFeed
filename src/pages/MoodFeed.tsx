// 情绪粒子
import { useState, useRef, useEffect } from "react";
import {
  analyzeEmotionStream,
  chatWithContext,
  simulateEmotion,
  type AnalysisReport,
} from "../services/aiService";
import { MarkdownReport } from "../components/MarkdownReport";
import { useEmotionHistory } from "../hooks/useEmotionHistory";
import { EmotionGraph } from "../components/EmotionGraph";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// 粒子类
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 4 + 2;
  }
  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > canvasWidth || this.x < 0) this.vx *= -1;
    if (this.y > canvasHeight || this.y < 0) this.vy *= -1;
  }
}

function MoodFeed() {
  // 粒子画布
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  //右上角的情绪数据
  const [moodLabel, setMoodLabel] = useState("等待输入...");
  //分析的内容
  const [reportContent, setReportContent] = useState("");
  //是否流式输出
  const [isStreaming, setIsStreaming] = useState(false);

  //处理上下文的对话
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  //上文
  const [followUp, setFollowUp] = useState("");
  //是否正在回答中
  const [isChatting, setIsChatting] = useState(false);

  //情绪历史用于图表
  const { records, addRecord, clearHistory } = useEmotionHistory();

  //粒子相关
  //用useRef是因为是动画
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const colorRef = useRef<string>("#4a8fd8");
  const speedRef = useRef<number>(0.5);

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
        particlesRef.current = Array.from(
          { length: 100 },
          () => new Particle(canvas.width, canvas.height),
        );
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        p.update(canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = colorRef.current;
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      //？不知道为什么requestAnimationFrame
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 不知道为什么要取消帧
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const updateMood = (valence: number, arousal: number) => {
    // valence积极值  arousal唤醒值
    // 颜色映射的算法逻辑   红色的R值大其他小  蓝色B值大其他小
    // 红色：rgb(255,0,0)
    //蓝色: rgb(0,0,255)
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

    // 至于为什么要加targetSpeed我也不知道
    speedRef.current = 0.3 + arousal * 2.0;
    particlesRef.current.forEach((p) => {
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
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

    let label = "";
    if (valence > 0.3 && arousal > 0.5) label = "兴奋愉悦 🎉";
    else if (valence > 0.3 && arousal <= 0.5) label = "平静满足 😌";
    else if (valence <= 0.3 && valence > -0.3) label = "中性平静 😐";
    else if (valence <= -0.3 && arousal > 0.5) label = "焦虑愤怒 😡";
    else if (valence <= -0.3 && arousal <= 0.5) label = "忧郁低沉 😔";
    setMoodLabel(label);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert("请先输入一段文字！");
      return;
    }
    setIsAnalyzing(true);
    setIsStreaming(true);
    setReportContent("");
    // 这里我确实不太理解，这个是追问的回答，如果重新开始新的对话应该是要删除上次的
    setConversation([]);

    // onChunk     处理一个字一个的输出
    // onComplete  处理完成后
    await analyzeEmotionStream(
      inputText,
      (chunk) => setReportContent((prev) => prev + chunk),
      (report: AnalysisReport) => {
        updateMood(report.emotion.valence, report.emotion.arousal);
        setReportContent(report.markdown);
        setIsStreaming(false);
        setIsAnalyzing(false);
        setMoodLabel(
          `分析完成 (${report.emotion.valence.toFixed(2)}, ${report.emotion.arousal.toFixed(2)})`,
        );

        // 保存历史记录时为什么要截断内容 ，我也不知道？字太多了吗？
        addRecord({
          timestamp: Date.now(),
          valence: report.emotion.valence,
          arousal: report.emotion.arousal,
          content:
            inputText.slice(0, 50) + (inputText.length > 50 ? "..." : ""),
          markdown:
            report.markdown.slice(0, 200) +
            (report.markdown.length > 200 ? "..." : ""),
        });

        setConversation((prev) => [
          ...prev,
          { role: "user", content: inputText },
          { role: "assistant", content: report.markdown },
        ]);
      },
      (error) => {
        console.error("分析失败:", error);
        const fallback = simulateEmotion(inputText);
        updateMood(fallback.valence, fallback.arousal);
        setIsStreaming(false);
        setIsAnalyzing(false);
        setReportContent("⚠️ AI 服务暂时不可用，已切换至本地模拟模式。");
      },
    );
  };

  //追问逻辑
  const handleFollowUp = async () => {
    if (!followUp.trim()) return;
    const userMessage = followUp;
    setFollowUp("");
    setIsChatting(true);

    setReportContent(
      (prev) => prev + "\n\n---\n\n**你：** " + userMessage + "\n\n**AI：** ",
    );

    // conversation具体指的是什么我也有点搞不懂了
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...conversation,
      { role: "user", content: userMessage },
    ];

    await chatWithContext(
      messages,
      (chunk) => setReportContent((prev) => prev + chunk),
      (fullContent) => {
        setConversation((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          { role: "assistant", content: fullContent },
        ]);
        setIsChatting(false);
      },
      (error) => {
        console.error("追问失败：", error);
        setReportContent((prev) => prev + "\n\n⚠️ 追问失败，请稍后重试。");
        setIsChatting(false);
      },
    );
  };

  const chartData = [...records]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      valence: r.valence,
      arousal: r.arousal,
    }));

  const handleClearAll = () => {
    clearHistory();
    setConversation([]);
    setReportContent("");
    setMoodLabel("等待输入...");
    setInputText("");
    colorRef.current = "#4a8fd8";
  };

  // ① 为什么图表容器需要 minHeight: 0？  我没看到图表容器有这个
  // ② flex: 1 + minHeight: 0 的作用是什么？  不知道
  // ③ 为什么 ResponsiveContainer 的父容器必须有明确高度？ 不知道
  // ==================== 新布局 ====================
  return (
    <div
      style={{
        minHeight: "calc(100vh - 100px)",
        background: "linear-gradient(135deg, #0f172a, #1a2a6c, #0c4a6e)",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          height: "92vh",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6)",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* ===== 头部 ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                background: "#3b82f6",
                borderRadius: "50%",
                boxShadow: "0 0 20px #3b82f6",
              }}
            />
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              🌊 情绪粒子记录仪
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "13px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#93c5fd",
                padding: "4px 16px",
                borderRadius: "9999px",
              }}
            >
              {isAnalyzing ? "⏳ 思考中..." : moodLabel}
            </span>
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  fontSize: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f87171",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                }}
              >
                清空历史
              </button>
            )}
          </div>
        </div>

        {/* ===== 上部分：左右布局 ===== */}
        <div style={{ display: "flex", flex: 1, gap: "18px", minHeight: 0 }}>
          {/* 左侧：输入 + 报告 + 追问 */}
          <div
            style={{
              flex: "0 0 45%",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minHeight: 0,
            }}
          >
            {/* 输入框 */}
            <textarea
              style={{
                flexShrink: 0,
                height: "65px",
                padding: "14px",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                color: "#fff",
                outline: "none",
                resize: "none",
                fontSize: "14px",
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
              placeholder="输入今天看到的视频、听到的笑话、写的日记…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing}
            />

            {/* 分析按钮 */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              style={{
                flexShrink: 0,
                padding: "10px",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                fontWeight: "500",
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 30px rgba(59, 130, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(59, 130, 246, 0.3)";
              }}
            >
              {isAnalyzing ? "⏳ 分析中..." : "✨ 分析情绪并启动粒子"}
            </button>

            {/* 报告区（占据剩余空间） */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "14px",
                padding: "12px 14px",
                overflowY: "auto",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "rgba(59, 130, 246, 0.6)",
                  marginBottom: "6px",
                  letterSpacing: "0.3px",
                }}
              >
                📄 AI 情绪分析报告
              </p>
              <div
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                <MarkdownReport
                  content={reportContent}
                  isStreaming={isStreaming}
                />
              </div>
            </div>

            {/* 追问区域（固定在底部） */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                gap: "10px",
                marginTop: "2px",
              }}
            >
              <input
                type="text"
                placeholder="追问 AI（比如：为什么我会这样？）"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                disabled={isChatting || conversation.length === 0}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#fff",
                  outline: "none",
                  fontSize: "13px",
                }}
              />
              <button
                onClick={handleFollowUp}
                disabled={isChatting || conversation.length === 0}
                style={{
                  padding: "8px 16px",
                  background:
                    conversation.length === 0
                      ? "rgba(255,255,255,0.05)"
                      : "#3b82f6",
                  color:
                    conversation.length === 0
                      ? "rgba(255,255,255,0.3)"
                      : "#fff",
                  border: "none",
                  borderRadius: "12px",
                  cursor: conversation.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                {isChatting ? "⏳" : "💬 追问"}
              </button>
            </div>
          </div>

          {/* 右侧：画布 */}
          <div
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              borderRadius: "18px",
              overflow: "hidden",
              position: "relative",
              boxShadow: "inset 0 0 60px rgba(59, 130, 246, 0.05)",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "14px",
                fontSize: "11px",
                color: "rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.5)",
                padding: "4px 14px",
                borderRadius: "9999px",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              100 个粒子 · 实时渲染
            </div>
          </div>
        </div>

        {/* ===== 下部分：图表 + 图谱 ===== */}
        {records.length > 0 && (
          <div
            style={{
              flexShrink: 0,
              height: "210px",
              display: "flex",
              gap: "14px",
            }}
          >
            {/* 历史趋势图 */}
            <div
              style={{
                flex: 1,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                padding: "8px 14px 4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: "26px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.3px",
                  }}
                >
                  📈 情绪历史趋势（共 {records.length} 条记录）
                </p>
                <span
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}
                >
                  Valence（蓝）· Arousal（青）
                </span>
              </div>
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    domain={[-1.2, 1.2]}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#93c5fd" }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="rgba(255,255,255,0.15)"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="valence"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="arousal"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#06b6d4" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 情绪知识图谱 */}
            {records.length >= 2 && (
              <div
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "16px",
                  padding: "8px 12px 4px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.3px",
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  🕸️ 情绪知识图谱（节点大小 = 情绪强度，颜色 = 极性）
                </p>
                <div style={{ height: "calc(100% - 26px)" }}>
                  <EmotionGraph records={records} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodFeed;
