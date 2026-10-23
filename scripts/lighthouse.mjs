import fs from "node:fs"
import path from "node:path"
import lighthouse, { desktopConfig } from "lighthouse"
import * as chromeLauncher from "chrome-launcher"

const BASE_URL = process.env.LH_BASE_URL ?? "http://localhost:4173"
const RUNS = Number(process.env.LH_RUNS ?? 3)
const PAGES = [
  { name: "inicio", path: "/" },
  { name: "detalhe", path: "/nfts/nft-1" },
]
const PROFILES = ["mobile", "desktop"]
const OUT_DIR = path.resolve("lighthouse")
const REPORTS_DIR = path.join(OUT_DIR, "reports")

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

fs.mkdirSync(REPORTS_DIR, { recursive: true })

const summary = []
let environment = null

for (const page of PAGES) {
  for (const profile of PROFILES) {
    const runs = []
    for (let run = 1; run <= RUNS; run += 1) {
      const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] })
      try {
        const result = await lighthouse(
          `${BASE_URL}${page.path}`,
          { port: chrome.port, output: ["html", "json"], logLevel: "error" },
          profile === "desktop" ? desktopConfig : undefined,
        )
        const { lhr, report } = result
        const base = path.join(REPORTS_DIR, `${page.name}-${profile}-${run}`)
        fs.writeFileSync(`${base}.html`, report[0])
        fs.writeFileSync(`${base}.json`, report[1])

        environment ??= {
          lighthouse: lhr.lighthouseVersion,
          userAgent: lhr.environment.hostUserAgent,
          node: process.version,
          platform: process.platform,
          baseUrl: BASE_URL,
        }
        runs.push({
          performance: Math.round((lhr.categories.performance.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories.accessibility.score ?? 0) * 100),
          bestPractices: Math.round((lhr.categories["best-practices"].score ?? 0) * 100),
          seo: Math.round((lhr.categories.seo.score ?? 0) * 100),
          lcp: lhr.audits["largest-contentful-paint"].numericValue,
          cls: lhr.audits["cumulative-layout-shift"].numericValue,
          tbt: lhr.audits["total-blocking-time"].numericValue,
        })
      } finally {
        await chrome.kill()
      }
    }

    const pick = (key) => median(runs.map((item) => item[key]))
    summary.push({
      page: page.name,
      profile,
      runs: RUNS,
      performance: pick("performance"),
      accessibility: pick("accessibility"),
      bestPractices: pick("bestPractices"),
      seo: pick("seo"),
      lcpMs: Math.round(pick("lcp")),
      cls: Number(pick("cls").toFixed(3)),
      tbtMs: Math.round(pick("tbt")),
    })
    console.log(`✔ ${page.name} / ${profile}`)
  }
}

fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify({ environment, summary }, null, 2))

const header = "| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |\n|---|---|---|---|---|---|---|---|---|\n"
const rows = summary
  .map(
    (row) =>
      `| ${row.page} | ${row.profile} | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} | ${row.lcpMs} | ${row.cls} | ${row.tbtMs} |`,
  )
  .join("\n")
fs.writeFileSync(
  path.join(OUT_DIR, "summary.md"),
  `# Lighthouse (mediana de ${RUNS} medições)\n\n${header}${rows}\n\n- Lighthouse: ${environment.lighthouse}\n- Navegador: ${environment.userAgent}\n- Node: ${environment.node} (${environment.platform})\n- URL: ${environment.baseUrl} (build otimizado, cenário padrão dos mocks)\n`,
)
console.log("Resumo salvo em lighthouse/summary.md")
