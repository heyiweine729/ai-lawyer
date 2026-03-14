'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Plus,
  Loader2,
  Link as LinkIcon,
  Download,
  FileText,
  Trash2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', title: '合同纠纷案情分析', updatedAt: '3月12日' },
    { id: '2', title: '劳动争议法条查询', updatedAt: '3月10日' },
  ]);
  const [activeSession, setActiveSession] = useState('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '你好！我是你的AI法律助手。我可以帮你：\n\n• 分析案情，识别争议焦点\n• 查找相关法律条文\n• 提供诉讼策略建议\n• 起草法律文书\n\n请描述你的法律问题，或上传案件相关材料。',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // AI 回复占位
    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '' },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error('请求失败');

      // 流式读取
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              accumulated += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: accumulated } : m
                )
              );
            } catch {
              // 跳过解析错误
            }
          }
        }
      }
    } catch (err) {
      console.error('对话失败:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: '抱歉，请求出错了。请检查 API 配置后重试。' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages]);

  // Enter 发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 新建对话
  const handleNewSession = () => {
    const newId = Date.now().toString();
    setSessions((prev) => [
      { id: newId, title: '新对话', updatedAt: '刚刚' },
      ...prev,
    ]);
    setActiveSession(newId);
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: '新对话已创建。请描述你想咨询的法律问题。',
      },
    ]);
  };

  return (
    <div
      className="flex -m-6 h-[calc(100vh-var(--header-height))]"
      style={{ background: 'var(--surface-tertiary)' }}
    >
      {/* 左侧会话列表 */}
      <div
        className="w-60 shrink-0 flex flex-col border-r"
        style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-light)' }}
      >
        <div className="p-3">
          <button className="btn btn-sm w-full" onClick={handleNewSession}>
            <Plus className="w-4 h-4" /> 新建对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              className="w-full text-left px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors"
              style={{
                background: activeSession === s.id ? 'var(--brand-50)' : 'transparent',
                color: activeSession === s.id ? 'var(--brand-600)' : 'var(--text-secondary)',
              }}
              onClick={() => setActiveSession(s.id)}
            >
              <div className="font-medium truncate">{s.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {s.updatedAt}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧对话区 */}
      <div className="flex-1 flex flex-col">
        {/* 消息区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background:
                      msg.role === 'user' ? 'var(--brand-500)' : 'var(--surface-primary)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      AI 律师助手
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {msg.content}
                    {isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant' && (
                      <span className="typing-cursor" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="px-6">
          <div className="max-w-3xl mx-auto flex gap-2 mb-2">
            <button className="btn btn-ghost btn-sm text-xs">
              <LinkIcon className="w-3 h-3" /> 关联案件
            </button>
            <button className="btn btn-ghost btn-sm text-xs">
              <Download className="w-3 h-3" /> 导出记录
            </button>
            <button className="btn btn-ghost btn-sm text-xs">
              <FileText className="w-3 h-3" /> 生成文书
            </button>
          </div>
        </div>

        {/* 输入区 */}
        <div className="px-6 pb-4">
          <div
            className="max-w-3xl mx-auto flex items-end gap-3 p-3 rounded-2xl border"
            style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-light)' }}
          >
            <textarea
              ref={inputRef}
              className="flex-1 resize-none border-0 bg-transparent text-sm leading-relaxed outline-none"
              style={{ color: 'var(--text-primary)', minHeight: 24, maxHeight: 120 }}
              rows={1}
              placeholder="描述你的法律问题，Shift+Enter 换行…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary btn-sm shrink-0"
              disabled={!input.trim() || isStreaming}
              onClick={handleSend}
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="max-w-3xl mx-auto text-center mt-2">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              AI 分析仅供参考，请律师审核后使用
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
