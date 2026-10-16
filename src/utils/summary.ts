// 요약에 쓰인 입력과 현재 입력이 같은지 비교하기 위한 동기 해시 (djb2)
export const hashMemoSource = (title: string, content: string): string => {
  const source = `${title}\u0000${content}`
  let hash = 5381
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

// 서버 라우트(/api/summarize)로 요약 요청
export const requestSummary = async (
  title: string,
  content: string
): Promise<string> => {
  let response: Response
  try {
    response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
  } catch {
    throw new Error('네트워크 오류로 요약하지 못했습니다. 다시 시도해주세요.')
  }

  const data: { summary?: string; error?: string } = await response
    .json()
    .catch(() => ({}))

  if (!response.ok || !data.summary) {
    throw new Error(data.error ?? '요약하지 못했습니다. 다시 시도해주세요.')
  }
  return data.summary
}
