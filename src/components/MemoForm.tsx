'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Memo,
  MemoFormData,
  MEMO_CATEGORIES,
  DEFAULT_CATEGORIES,
} from '@/types/memo'
import MarkdownPreview from './MarkdownPreview'

interface MemoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MemoFormData) => void
  editingMemo?: Memo | null
}

export default function MemoForm({
  isOpen,
  onClose,
  onSubmit,
  editingMemo,
}: MemoFormProps) {
  const [formData, setFormData] = useState<MemoFormData>({
    title: '',
    content: '',
    category: 'personal',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // 편집 모드일 때 폼 데이터 설정
  useEffect(() => {
    if (editingMemo) {
      setFormData({
        title: editingMemo.title,
        content: editingMemo.content,
        category: editingMemo.category,
        tags: editingMemo.tags,
      })
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'personal',
        tags: [],
      })
    }
    setTagInput('')
  }, [editingMemo, isOpen])

  // 팝업 열림/편집 대상이 바뀌면 확인 팝업 초기화
  useEffect(() => {
    setShowConfirm(false)
  }, [editingMemo, isOpen])

  // 변경 여부: 초기값(편집 대상 또는 빈 폼)과 비교
  const isDirty = useMemo(() => {
    const initial = editingMemo
      ? {
          title: editingMemo.title,
          content: editingMemo.content,
          category: editingMemo.category,
          tags: editingMemo.tags,
        }
      : { title: '', content: '', category: 'personal', tags: [] as string[] }
    return (
      formData.title !== initial.title ||
      formData.content !== initial.content ||
      formData.category !== initial.category ||
      formData.tags.length !== initial.tags.length ||
      formData.tags.some((tag, i) => tag !== initial.tags[i]) ||
      tagInput.trim() !== ''
    )
  }, [formData, tagInput, editingMemo])

  // 바깥 클릭 / ESC 로 닫기 요청: 변경이 있으면 저장 여부를 묻는다
  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showConfirm) {
        setShowConfirm(false)
      } else {
        handleRequestClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showConfirm, handleRequestClose])

  const saveAndClose = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      setShowConfirm(false)
      return
    }
    onSubmit(formData)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveAndClose()
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // 입력칸 <-> 미리보기 스크롤 동기화 (스크롤 비율 기준)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  // 동기화로 발생한 스크롤 이벤트가 상대편을 다시 움직이지 않도록 무시할 대상 표시
  const ignoreScrollRef = useRef<'textarea' | 'preview' | null>(null)

  const syncScroll = useCallback(
    (
      source: HTMLElement,
      target: HTMLElement,
      targetName: 'textarea' | 'preview'
    ) => {
      const sourceRange = source.scrollHeight - source.clientHeight
      const targetRange = target.scrollHeight - target.clientHeight
      // 어느 한쪽에 세로 스크롤바가 없으면 동기화하지 않음
      if (sourceRange <= 0 || targetRange <= 0) return

      const nextTop = (source.scrollTop / sourceRange) * targetRange
      if (Math.abs(target.scrollTop - nextTop) < 1) return

      const prevTop = target.scrollTop
      target.scrollTop = nextTop
      // 실제로 스크롤이 바뀐 경우에만 다음 이벤트 1회를 무시
      if (target.scrollTop !== prevTop) {
        ignoreScrollRef.current = targetName
        requestAnimationFrame(() => {
          if (ignoreScrollRef.current === targetName) {
            ignoreScrollRef.current = null
          }
        })
      }
    },
    []
  )

  const handleTextareaScroll = useCallback(() => {
    if (ignoreScrollRef.current === 'textarea') {
      ignoreScrollRef.current = null
      return
    }
    if (textareaRef.current && previewRef.current) {
      syncScroll(textareaRef.current, previewRef.current, 'preview')
    }
  }, [syncScroll])

  const handlePreviewScroll = useCallback(() => {
    if (ignoreScrollRef.current === 'preview') {
      ignoreScrollRef.current = null
      return
    }
    if (textareaRef.current && previewRef.current) {
      syncScroll(previewRef.current, textareaRef.current, 'textarea')
    }
  }, [syncScroll])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      data-testid="memo-form-backdrop"
      onMouseDown={e => {
        // 드래그 선택이 바깥에서 끝나도 닫히지 않도록 배경에서 시작한 클릭만 처리
        if (e.target === e.currentTarget) handleRequestClose()
      }}
    >
      <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg shadow-xl max-w-2xl md:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingMemo ? '메모 편집' : '새 메모 작성'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
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

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="placeholder-gray-400 text-gray-400 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="메모 제목을 입력하세요"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                카테고리
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="text-gray-400 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {DEFAULT_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {MEMO_CATEGORIES[category]}
                  </option>
                ))}
              </select>
            </div>

            {/* 내용 (마크다운 편집기 + 실시간 미리보기) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  내용 * (마크다운 지원)
                </label>
                <textarea
                  id="content"
                  ref={textareaRef}
                  onScroll={handleTextareaScroll}
                  value={formData.content}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="placeholder-gray-400 text-gray-400 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 w-full h-80 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="# 제목&#10;**굵게**, *기울임*, - 목록, `코드` 등 마크다운으로 작성하세요"
                  required
                />
              </div>
              <div>
                <span
                  id="content-preview-label"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  미리보기
                </span>
                <div
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                  role="region"
                  aria-labelledby="content-preview-label"
                  className="w-full h-80 overflow-y-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-950"
                  data-testid="memo-form-preview"
                >
                  <MarkdownPreview content={formData.content} />
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                태그
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="placeholder-gray-400 text-black dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="태그를 입력하고 Enter를 누르세요"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  추가
                </button>
              </div>

              {/* 태그 목록 */}
              {formData.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingMemo ? '수정하기' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 저장 여부 확인 팝업 */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-[60]"
          data-testid="memo-form-confirm-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowConfirm(false)
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="memo-confirm-title"
            className="bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6"
          >
            <h3
              id="memo-confirm-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              변경 내용을 저장할까요?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              저장하지 않고 닫으면 변경 내용이 사라집니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                data-testid="memo-confirm-continue-btn"
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                계속 편집
              </button>
              <button
                type="button"
                onClick={onClose}
                data-testid="memo-confirm-discard-btn"
                className="flex-1 px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 rounded-lg transition-colors"
              >
                저장 안 함
              </button>
              <button
                type="button"
                onClick={saveAndClose}
                data-testid="memo-confirm-save-btn"
                className="flex-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
