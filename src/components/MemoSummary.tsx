'use client'

import { useState, useMemo } from 'react'
import { Memo } from '@/types/memo'
import { hashMemoSource, requestSummary } from '@/utils/summary'
import MarkdownPreview from './MarkdownPreview'

interface MemoSummaryProps {
  memo: Memo
  onSummarize: (id: string, summary: string, sourceHash: string) => void
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// 메모마다 key={memo.id}로 마운트해 상태가 메모 간에 섞이지 않게 한다
export default function MemoSummary({ memo, onSummarize }: MemoSummaryProps) {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentHash = useMemo(
    () => hashMemoSource(memo.title, memo.content),
    [memo.title, memo.content]
  )
  const isStale = !!memo.summary && memo.summarySourceHash !== currentHash

  const handleSummarize = async () => {
    // 요청 시점의 입력으로 해시를 확정한다 (응답 대기 중 수정되어도 낡음 판정이 정확하도록)
    const requestedHash = currentHash
    setIsSummarizing(true)
    setError(null)
    try {
      const summary = await requestSummary(memo.title, memo.content)
      onSummarize(memo.id, summary, requestedHash)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '요약하지 못했습니다. 다시 시도해주세요.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <section
      className="mb-6 p-4 rounded-lg bg-violet-50 border border-violet-200 dark:bg-violet-950/30 dark:border-violet-900"
      aria-labelledby="memo-summary-title"
      data-testid="memo-summary"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3
          id="memo-summary-title"
          className="text-sm font-semibold text-violet-800 dark:text-violet-300"
        >
          ✨ AI 요약
        </h3>
        {memo.summaryGeneratedAt && (
          <span className="text-xs text-violet-700 dark:text-violet-400">
            {formatDate(memo.summaryGeneratedAt)}
          </span>
        )}
      </div>

      {memo.summary && (
        <div className="mb-3" data-testid="memo-summary-content">
          <MarkdownPreview content={memo.summary} />
        </div>
      )}

      {isStale && (
        <p
          className="mb-3 text-xs text-amber-700 dark:text-amber-400"
          data-testid="memo-summary-stale"
        >
          메모가 수정되어 요약이 최신이 아닐 수 있습니다. 다시 요약해보세요.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-3 text-sm text-red-600 dark:text-red-400"
          data-testid="memo-summary-error"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSummarize}
        disabled={isSummarizing}
        className="px-4 py-2 text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        data-testid="memo-summary-btn"
      >
        {isSummarizing
          ? '요약 중…'
          : error
            ? '다시 시도'
            : memo.summary
              ? '다시 요약'
              : 'AI 요약'}
      </button>
    </section>
  )
}
