import { test, expect, Page } from '@playwright/test'

const MEMO_TITLE = '프로젝트 회의 준비'
const FAKE_SUMMARY = '킥오프 미팅 준비: 범위 정의, 역할 분담, 일정 수립'

const openMemo = async (page: Page, title: string) => {
  await page.getByRole('button', { name: `${title} 상세보기` }).click()
  await expect(page.getByTestId('memo-viewer')).toBeVisible()
}

const mockSummarize = async (page: Page, summary = FAKE_SUMMARY) => {
  await page.route('**/api/summarize', route =>
    route.fulfill({ json: { summary } })
  )
}

test.describe('AI 메모 요약', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(MEMO_TITLE).first()).toBeVisible()
  })

  test('요약을 만들면 표시되고 다시 열어도 유지된다', async ({ page }) => {
    await mockSummarize(page)
    await openMemo(page, MEMO_TITLE)

    await page.getByTestId('memo-summary-btn').click()
    await expect(page.getByTestId('memo-summary-content')).toContainText(
      FAKE_SUMMARY
    )
    await expect(page.getByTestId('memo-summary-btn')).toHaveText('다시 요약')
    await expect(page.getByTestId('memo-summary-stale')).toHaveCount(0)

    await page.getByTestId('memo-viewer-close-btn').click()
    await page.reload()
    await openMemo(page, MEMO_TITLE)
    await expect(page.getByTestId('memo-summary-content')).toContainText(
      FAKE_SUMMARY
    )
  })

  test('요약 중에는 버튼이 비활성화되고 로딩 문구가 보인다', async ({
    page,
  }) => {
    await page.route('**/api/summarize', async route => {
      await new Promise(resolve => setTimeout(resolve, 500))
      await route.fulfill({ json: { summary: FAKE_SUMMARY } })
    })
    await openMemo(page, MEMO_TITLE)

    await page.getByTestId('memo-summary-btn').click()
    await expect(page.getByTestId('memo-summary-btn')).toBeDisabled()
    await expect(page.getByTestId('memo-summary-btn')).toHaveText('요약 중…')
    await expect(page.getByTestId('memo-summary-content')).toBeVisible()
  })

  test('메모를 수정하면 낡음 표시가 뜨고 다시 요약하면 사라진다', async ({
    page,
  }) => {
    await mockSummarize(page)
    await openMemo(page, MEMO_TITLE)
    await page.getByTestId('memo-summary-btn').click()
    await expect(page.getByTestId('memo-summary-content')).toBeVisible()

    // 편집 후 저장
    await page.getByTestId('memo-viewer-edit-btn').click()
    await page.locator('#content').fill('내용을 완전히 새로 고쳤습니다.')
    await page.getByRole('button', { name: '수정하기' }).click()

    await openMemo(page, MEMO_TITLE)
    await expect(page.getByTestId('memo-summary-content')).toContainText(
      FAKE_SUMMARY
    )
    await expect(page.getByTestId('memo-summary-stale')).toBeVisible()

    await page.getByTestId('memo-summary-btn').click()
    await expect(page.getByTestId('memo-summary-stale')).toHaveCount(0)
  })

  test('요약에 실패하면 오류를 보여주고 기존 요약은 유지한다', async ({
    page,
  }) => {
    await mockSummarize(page)
    await openMemo(page, MEMO_TITLE)
    await page.getByTestId('memo-summary-btn').click()
    await expect(page.getByTestId('memo-summary-content')).toBeVisible()

    await page.unroute('**/api/summarize')
    await page.route('**/api/summarize', route =>
      route.fulfill({
        status: 502,
        json: { error: 'AI 요약 중 오류가 발생했습니다.' },
      })
    )
    await page.getByTestId('memo-summary-btn').click()

    await expect(page.getByTestId('memo-summary-error')).toHaveText(
      'AI 요약 중 오류가 발생했습니다.'
    )
    await expect(page.getByTestId('memo-summary-content')).toContainText(
      FAKE_SUMMARY
    )
    await expect(page.getByTestId('memo-summary-btn')).toHaveText('다시 시도')
  })
})
