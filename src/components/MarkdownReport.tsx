// MarkDown的实时渲染
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownReportProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownReport({ content, isStreaming }: MarkdownReportProps) {
  if (!content) {
    return (
      <div className="text-gray-400 text-sm text-center py-8">
        等待 AI 生成分析报告...
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1 h-4 bg-purple-500 ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}