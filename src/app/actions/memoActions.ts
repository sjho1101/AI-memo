'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { createSupabaseClient } from '@/utils/supabase'

// DB 행(snake_case) <-> Memo 인터페이스(camelCase) 변환
interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  reviewed_at: string | null
  review_comment: string | null
  summary: string | null
  summary_generated_at: string | null
  summary_source_hash: string | null
}

const toMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  reviewedAt: row.reviewed_at ?? undefined,
  reviewComment: row.review_comment ?? undefined,
  summary: row.summary ?? undefined,
  summaryGeneratedAt: row.summary_generated_at ?? undefined,
  summarySourceHash: row.summary_source_hash ?? undefined,
})

const fail = (action: string, message: string): never => {
  console.error(`Supabase ${action} failed:`, message)
  throw new Error('메모 저장소 요청에 실패했습니다. 다시 시도해주세요.')
}

// 전체 메모 조회 (최신순)
export async function fetchMemos(): Promise<Memo[]> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<MemoRow[]>()

  if (error) fail('fetchMemos', error.message)
  return (data ?? []).map(toMemo)
}

// 메모 생성 (ID는 uuid v4)
export async function createMemoAction(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .insert({
      id: uuidv4(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single<MemoRow>()

  if (error || !data) return fail('createMemo', error?.message ?? 'no data')
  return toMemo(data)
}

// 메모 수정
export async function updateMemoAction(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .update({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single<MemoRow>()

  if (error || !data) return fail('updateMemo', error?.message ?? 'no data')
  return toMemo(data)
}

// 메모 리뷰 (완료 처리 + 회고 코멘트)
export async function reviewMemoAction(
  id: string,
  comment: string
): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .update({
      reviewed_at: new Date().toISOString(),
      review_comment: comment.trim(),
    })
    .eq('id', id)
    .select()
    .single<MemoRow>()

  if (error || !data) return fail('reviewMemo', error?.message ?? 'no data')
  return toMemo(data)
}

// AI 요약 저장 (요청 시점 입력 해시를 함께 기록)
export async function saveSummaryAction(
  id: string,
  summary: string,
  sourceHash: string
): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .update({
      summary,
      summary_generated_at: new Date().toISOString(),
      summary_source_hash: sourceHash,
    })
    .eq('id', id)
    .select()
    .single<MemoRow>()

  if (error || !data) return fail('saveSummary', error?.message ?? 'no data')
  return toMemo(data)
}

// 메모 삭제
export async function deleteMemoAction(id: string): Promise<void> {
  const { error } = await createSupabaseClient()
    .from('memos')
    .delete()
    .eq('id', id)

  if (error) fail('deleteMemo', error.message)
}

// 모든 메모 삭제
export async function clearMemosAction(): Promise<void> {
  const { error } = await createSupabaseClient()
    .from('memos')
    .delete()
    .not('id', 'is', null)

  if (error) fail('clearMemos', error.message)
}
