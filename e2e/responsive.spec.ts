import { expect, test } from "@playwright/test"

const WIDTHS = [390, 768, 1440]
const PATHS = ["/", "/nfts/nft-1", "/cart", "/login", "/signup"]

test.describe("sem overflow horizontal", () => {
  test.skip(({ isMobile }) => isMobile, "os três tamanhos são percorridos no projeto desktop")

  for (const width of WIDTHS) {
    for (const path of PATHS) {
      test(`${path} em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await page.waitForLoadState("networkidle")
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBeLessThanOrEqual(1)
      })
    }
  }
})
