'use client'

import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface MarkdownPreviewProps {
  content: string
  emptyText?: string
}

// 기존 일반 텍스트 메모의 줄바꿈이 유지되도록 remark-breaks 사용
const REMARK_PLUGINS = [remarkGfm, remarkBreaks]

const MARKDOWN_COMPONENTS: Components = {
  // 외부 링크는 새 탭에서 안전하게 열기
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  // 좁은 화면에서 표가 찌그러지지 않고 가로 스크롤되도록 래퍼로 감싸기
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="my-0">{children}</table>
    </div>
  ),
}

export default function MarkdownPreview({
  content,
  emptyText = '미리볼 내용이 없습니다.',
}: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500">{emptyText}</p>
    )
  }

  return (
    <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none prose-th:min-w-20 prose-td:min-w-20 prose-th:break-keep prose-td:break-keep [--tw-prose-links:var(--color-blue-600)] [--tw-prose-bullets:var(--color-gray-500)] [--tw-prose-counters:var(--color-gray-600)] dark:[--tw-prose-invert-links:var(--color-blue-400)] dark:[--tw-prose-invert-bullets:var(--color-gray-400)] dark:[--tw-prose-invert-counters:var(--color-gray-300)]">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
