// ============================================================
// 类型定义
// ============================================================
export interface EmotionResult {
  valence: number; // -1 ~ 1，负=消极，正=积极
  arousal: number; // 0 ~ 1，0=平静，1=激动
}

export interface AnalysisReport {
  markdown: string; // 完整的 Markdown 情绪分析报告
  emotion: EmotionResult; // 情绪数值（用于驱动粒子）
}

// ============================================================
// 核心函数：流式调用 Qwen API，返回 Markdown 报告 + 情绪数值
// ============================================================
export async function analyzeEmotionStream(
  text: string,
  onChunk: (chunk: string) => void,
  onComplete: (report: AnalysisReport) => void,
  onError: (err: Error) => void,
): Promise<void> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY;

  // ----- 降级方案：无 API Key 时使用模拟 -----
  if (!apiKey) {
    const result = simulateEmotion(text); //情绪值
    const fakeReport = generateMockReport(text, result); //markdown报告
    let index = 0;
    const interval = setInterval(() => {
      if (index < fakeReport.length) {
        onChunk(fakeReport[index]);
        index++;
      } else {
        clearInterval(interval);
        onComplete({
          markdown: fakeReport,
          emotion: result,
        });
      }
    }, 20);
    return;
  }

  // ----- 正常调用 Qwen API (流式) -----
  try {
    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-turbo",
          messages: [
            {
              role: "system",
              content: `你是一个情绪分析专家。请分析用户输入文本的情感，输出一份 Markdown 格式的情绪分析报告。

## 报告结构要求：
1. **情绪概览**：用一句话总结整体情绪
2. **情绪维度**：
   - 积极性（Valence）：-1 到 1 的数值
   - 唤醒度（Arousal）：0 到 1 的数值
3. **情绪标签**：给出 3-5 个情绪标签（如：愉悦、平静、焦虑）
4. **情绪分析**：详细分析文本中的情绪线索

## 格式要求：
- 使用 Markdown 格式
- 报告末尾用 \`---\` 分隔线
- 分隔线之后，单独一行输出 JSON：{"valence": 数值, "arousal": 数值}

## 示例报告：
\`\`\`markdown
## 📊 情绪概览
整体情绪偏向积极，带有一定的兴奋感。

## 📈 情绪维度
- **积极性（Valence）**：0.80
- **唤醒度（Arousal）**：0.35

## 🏷️ 情绪标签
#愉悦 #满足 #平静

## 📝 详细分析
用户输入的文字透露出一种温和的满足感，用词积极但不激进，整体情绪稳定。
---
{"valence": 0.80, "arousal": 0.35}
\`\`\`

请严格按照上述格式输出，确保 JSON 在最后一行且格式正确。`,
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
          stream: true, // 开启流式
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder("utf-8");
    let fullContent = "";

    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullContent += delta;
              onChunk(delta); // 逐字回调  每被调用一次页面就多一个字
            }
          } catch (e) {
            // 忽略解析错误（可能是不完整的 JSON）
          }
        }
      }
    }

    // 流结束，解析完整内容
    const report = parseReport(fullContent, text);
    onComplete(report);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================
// 辅助函数：从完整输出中提取 Markdown 报告和情绪数值
// ============================================================
function parseReport(
  fullContent: string,
  fallbackText: string,
): AnalysisReport {
  // 尝试用正则提取 JSON（在 --- 分隔符之后）
  const jsonMatch = fullContent.match(
    /---\s*\n(\{"valence":\s*[-\d.]+\s*,\s*"arousal":\s*[-\d.]+\s*\})/,
  );
  let emotion: EmotionResult;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      emotion = {
        valence: Math.max(-1, Math.min(1, parsed.valence || 0)),
        arousal: Math.max(0, Math.min(1, parsed.arousal || 0.5)),
      };
    } catch {
      emotion = simulateEmotion(fallbackText);
    }
  } else {
    // 如果没找到 JSON，尝试从全文解析（兼容旧格式）
    try {
      const parsed = JSON.parse(fullContent);
      emotion = {
        valence: Math.max(-1, Math.min(1, parsed.valence || 0)),
        arousal: Math.max(0, Math.min(1, parsed.arousal || 0.5)),
      };
    } catch {
      emotion = simulateEmotion(fallbackText);
    }
  }

  // 移除 JSON 部分，保留 Markdown 报告
  let markdown = fullContent;
  if (jsonMatch) {
    markdown = fullContent.replace(/---\s*\n\{.*\}$/, "").trim();
  }

  return { markdown, emotion };
}

// ============================================================
// 备选方案：本地模拟（无需 API Key，永远可用）
// ============================================================
export function simulateEmotion(text: string): EmotionResult {
  const excitement = (text.match(/[！!]/g)?.length || 0) * 0.2;
  const lengthFactor = Math.min(text.length / 100, 0.5);
  const randomFactor = (Math.random() - 0.5) * 0.4;

  return {
    valence: Math.max(-1, Math.min(1, 0.2 + randomFactor + lengthFactor * 0.3)),
    arousal: Math.max(0, Math.min(1, 0.3 + excitement + lengthFactor * 0.2)),
  };
}

// ============================================================
// 生成模拟 Markdown 报告（无 API Key 时使用）
// ============================================================
function generateMockReport(text: string, emotion: EmotionResult): string {
  const labels =
    emotion.valence > 0.3
      ? ["#愉悦", "#满足", "#平静"]
      : emotion.valence < -0.3
        ? ["#低落", "#焦虑", "#不安"]
        : ["#中性", "#平静", "#观察"];

  return `## 📊 情绪概览
整体情绪偏向 ${emotion.valence > 0 ? "积极" : emotion.valence < -0.3 ? "消极" : "中性"}，唤醒度 ${emotion.arousal > 0.6 ? "较高" : "较低"}。

## 📈 情绪维度
- **积极性（Valence）**：${emotion.valence.toFixed(2)}
- **唤醒度（Arousal）**：${emotion.arousal.toFixed(2)}

## 🏷️ 情绪标签
${labels.join(" ")}

## 📝 详细分析
（此为本地模拟分析）用户输入的文字长度为 ${text.length} 字符，情绪强度适中。
---
{"valence": ${emotion.valence.toFixed(2)}, "arousal": ${emotion.arousal.toFixed(2)}}`;
}

/**
 * 多轮对话（支持上下文）
 * @param messages 完整的对话历史 [{ role: 'user'|'assistant', content: string }]
 * @param onChunk 逐字回调
 * @param onComplete 完成回调（返回完整内容）
 * @param onError 错误回调
 */

export async function chatWithContext(
  messages: { role: "user" | "assistant"; content: string }[],
  onChunk: (chunk: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (err: Error) => void,
): Promise<void> {
  const apiKey = import.meta.env.VITE_QWEN_API_KEY;

  if (!apiKey) {
    // 无API Key时模拟回复
    const mockReply =
      "我是模拟助手。你刚才说：\n\n" +
      messages[messages.length - 1].content.slice(0, 50) +
      "...\n\n（这是本地模拟回复，请配置 VITE_QWEN_API_KEY 获取真实回答）";
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockReply.length) {
        onChunk(mockReply[index]);
        index++;
      } else {
        clearInterval(interval);
        onComplete(mockReply);
      }
    }, 25);
    return;
  }

  try {
    const response = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-turbo",
          messages: messages, // 直接传入完整历史
          temperature: 0.7,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder("utf-8");
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullContent += delta;
              onChunk(delta);
            }
          } catch (e) {}
        }
      }
    }

    onComplete(fullContent);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
