'use client'

import { useState, useCallback, useMemo } from 'react'
import { useMemos } from '@/hooks/useMemos'
import { useTheme } from '@/hooks/useTheme'
import { Memo, MemoFormData } from '@/types/memo'
import MemoList from '@/components/MemoList'
import MemoForm from '@/components/MemoForm'
import MemoViewer from '@/components/MemoViewer'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const {
    memos,
    allMemos,
    loading,
    searchQuery,
    selectedCategory,
    stats,
    createMemo,
    updateMemo,
    reviewMemo,
    saveSummary,
    deleteMemo,
    searchMemos,
    filterByCategory,
  } = useMemos()
  const { theme, toggleTheme } = useTheme()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  const handleCreateMemo = (formData: MemoFormData) => {
    createMemo(formData)
    setIsFormOpen(false)
  }

  const handleUpdateMemo = (formData: MemoFormData) => {
    if (editingMemo) {
      updateMemo(editingMemo.id, formData)
      setEditingMemo(null)
    }
  }

  const [viewingMemoId, setViewingMemoId] = useState<string | null>(null)

  // 리뷰 저장 등으로 메모가 갱신되면 뷰어에도 최신 데이터 반영
  const viewingMemo = useMemo(
    () => allMemos.find(memo => memo.id === viewingMemoId) ?? null,
    [allMemos, viewingMemoId]
  )

  const handleViewMemo = useCallback((memo: Memo) => {
    setViewingMemoId(memo.id)
  }, [])

  const handleCloseViewer = useCallback(() => {
    setViewingMemoId(null)
  }, [])

  const handleEditMemo = (memo: Memo) => {
    setViewingMemoId(null)
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMemo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  📝 메모 앱
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 메모
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MemoList
          memos={memos}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={searchMemos}
          onCategoryChange={filterByCategory}
          onViewMemo={handleViewMemo}
          onEditMemo={handleEditMemo}
          onDeleteMemo={deleteMemo}
          stats={stats}
        />
      </main>

      {/* 상세보기 모달 */}
      <MemoViewer
        memo={viewingMemo}
        onClose={handleCloseViewer}
        onEdit={handleEditMemo}
        onDelete={deleteMemo}
        onReview={reviewMemo}
        onSummarize={saveSummary}
      />

      {/* 모달 폼 */}
      <MemoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
        editingMemo={editingMemo}
      />
    </div>
  )
}
