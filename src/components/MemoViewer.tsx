'use client'

import { useState, useEffect } from 'react'
import { Memo, MEMO_CATEGORIES, CATEGORY_COLORS } from '@/types/memo'
import MarkdownPreview from './MarkdownPreview'
import MemoSummary from './MemoSummary'

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onReview: (id: string, comment: string) => void
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

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
  onReview,
  onSummarize,
}: MemoViewerProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewComment, setReviewComment] = useState('')

  const isOpen = memo !== null
  const memoId = memo?.id

  // 다른 메모를 열거나 닫을 때 리뷰 입력 상태 초기화
  useEffect(() => {
    setIsReviewing(false)
    setReviewComment('')
  }, [memoId])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!memo) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleStartReview = () => {
    setReviewComment(memo.reviewComment ?? '')
    setIsReviewing(true)
  }

  const handleCancelReview = () => {
    setIsReviewing(false)
    setReviewComment('')
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    onReview(memo.id, reviewComment)
    setIsReviewing(false)
    setReviewComment('')
  }

  const categoryColor =
    CATEGORY_COLORS[memo.category as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS.other

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
      data-testid="memo-viewer-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        data-testid="memo-viewer"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2
                id="memo-viewer-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 break-words"
              >
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                {memo.reviewedAt && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    data-testid="memo-viewer-reviewed-badge"
                  >
                    ✓ 리뷰 완료
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  수정: {formatDate(memo.updatedAt)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  작성: {formatDate(memo.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              data-testid="memo-viewer-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <div className="mb-6" data-testid="memo-viewer-content">
            <MarkdownPreview content={memo.content} />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {memo.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI 요약 */}
          <MemoSummary key={memo.id} memo={memo} onSummarize={onSummarize} />

          {/* 리뷰 결과 */}
          {memo.reviewedAt && !isReviewing && (
            <div
              className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
              data-testid="memo-viewer-review-result"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  리뷰
                </h3>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  {formatDate(memo.reviewedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {memo.reviewComment || '남긴 코멘트가 없습니다.'}
              </p>
            </div>
          )}

          {/* 리뷰 입력 폼 */}
          {isReviewing && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-6 space-y-3"
              data-testid="memo-viewer-review-form"
            >
              <label
                htmlFor="review-comment"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                회고 코멘트 (선택)
              </label>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                autoFocus
                rows={4}
                placeholder="이 메모를 처리한 뒤 느낀 점이나 회고를 남겨보세요"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                data-testid="memo-viewer-review-input"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelReview}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                  data-testid="memo-viewer-review-submit-btn"
                >
                  리뷰 완료
                </button>
              </div>
            </form>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleStartReview}
              disabled={isReviewing}
              aria-label={memo.reviewedAt ? '리뷰 수정' : '메모 리뷰'}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              data-testid="memo-viewer-review-btn"
            >
              {memo.reviewedAt ? '리뷰 수정' : '리뷰'}
            </button>
            <button
              onClick={() => onEdit(memo)}
              aria-label="메모 편집"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              data-testid="memo-viewer-edit-btn"
            >
              편집
            </button>
            <button
              onClick={handleDelete}
              aria-label="메모 삭제"
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              data-testid="memo-viewer-delete-btn"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
