/**
 * 通过东方财富接口获取 A 股名称→代码映射，用于补全「推荐标的」中的 (无代码)
 * 数据来源：push2.eastmoney.com，仅做名称与代码匹配
 */

const EASTMONEY_LIST_URL =
  "https://push2.eastmoney.com/api/qt/clist/get";
const PAGE_SIZE = 200;
const CACHE_MS = 24 * 60 * 60 * 1000; // 24 小时

let cachedMap: Map<string, string> | null = null;
let cachedAt = 0;

type Row = { f12: string; f14: string };
type ApiData = { total: number; diff?: Row[] };

async function fetchPage(pn: number): Promise<ApiData> {
  const url = new URL(EASTMONEY_LIST_URL);
  url.searchParams.set("pn", String(pn));
  url.searchParams.set("pz", String(PAGE_SIZE));
  url.searchParams.set("po", "1");
  url.searchParams.set("np", "1");
  url.searchParams.set("fltt", "2");
  url.searchParams.set("invt", "2");
  url.searchParams.set("fid", "f3");
  url.searchParams.set("fs", "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23");
  url.searchParams.set("fields", "f12,f14");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; family-wealth/1.0)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Eastmoney list fetch failed");
  const json = (await res.json()) as { data?: ApiData };
  return json.data ?? { total: 0, diff: [] };
}

export async function getStockNameToCodeMap(): Promise<Map<string, string>> {
  if (cachedMap && Date.now() - cachedAt < CACHE_MS) return cachedMap;

  const map = new Map<string, string>();
  const first = await fetchPage(1);
  const total = first.total || 0;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  for (const row of first.diff ?? []) {
    if (row.f14 && row.f12) map.set(row.f14.trim(), row.f12);
  }

  for (let pn = 2; pn <= Math.min(pages, 30); pn++) {
    const data = await fetchPage(pn);
    for (const row of data.diff ?? []) {
      if (row.f14 && row.f12) map.set(row.f14.trim(), row.f12);
    }
  }

  cachedMap = map;
  cachedAt = Date.now();
  return map;
}

/**
 * 根据股票名称查找 A 股代码（精确匹配优先，否则包含匹配）
 */
export async function lookupStockCode(name: string): Promise<string | null> {
  const map = await getStockNameToCodeMap();
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (map.has(trimmed)) return map.get(trimmed)!;
  for (const [stockName, code] of map) {
    if (stockName.includes(trimmed) || trimmed.includes(stockName)) return code;
  }
  return null;
}

/**
 * 将「名称 (无代码)」或「名称(无代码)」替换为「名称(代码)」；若查不到则保留原样
 */
export function parseRecommendedItem(text: string): { name: string; hasCode: boolean } {
  const noCodeMatch = text.match(/^(.+?)\s*[（(]无代码[）)]\s*$/);
  if (noCodeMatch) return { name: noCodeMatch[1].trim(), hasCode: false };
  const withCodeMatch = text.match(/^(.+?)\s*[（(](\d{6})[）)]\s*$/);
  if (withCodeMatch) return { name: withCodeMatch[1].trim(), hasCode: true };
  return { name: text.trim(), hasCode: false };
}

export async function fillStockCodes(items: string[]): Promise<string[]> {
  const map = await getStockNameToCodeMap();
  const result: string[] = [];
  for (const raw of items) {
    const { name, hasCode } = parseRecommendedItem(raw);
    if (hasCode) {
      result.push(raw);
      continue;
    }
    let code: string | null = map.get(name) ?? null;
    if (!code) {
      for (const [stockName, c] of map) {
        if (stockName.includes(name) || name.includes(stockName)) {
          code = c;
          break;
        }
      }
    }
    result.push(code ? `${name}(${code})` : `${name}(无代码)`);
  }
  return result;
}
