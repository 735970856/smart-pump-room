import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const required = [
  'index.html', 'src/App.vue', 'src/main.ts',
  'src/views/DashboardPage.vue', 'src/views/LoginPage.vue',
  'src/legacy-dashboard.js', 'src/industrial-room.js', 'src/soft-map.js',
  'src/regions.ts', 'src/FlightOverlay.ts', 'src/data.ts',
  'china-provinces.json', 'data/region-index.json',
  'public/assets/fonts.css', 'public/assets/fonts/LICENSE',
]
const missing = required.filter(file => !existsSync(file))
if (missing.length) throw new Error(`缺少关键资源: ${missing.join(', ')}`)
const boundaries = readdirSync('public/assets/regions').filter(filename => filename.endsWith('.json'))
if (boundaries.length < 30) throw new Error('省市行政区数据不完整')
const index = JSON.parse(readFileSync('data/region-index.json', 'utf-8'))
const national = JSON.parse(readFileSync('china-provinces.json', 'utf-8'))
if (!Array.isArray(national.features) || national.features.length < 30) throw new Error('全国地图边界数据无效')
for (const filename of boundaries) {
  const region = JSON.parse(readFileSync(join('public/assets/regions', filename), 'utf-8'))
  if (!Array.isArray(region.features)) throw new Error(`行政区文件格式异常: ${filename}`)
}
if (Object.keys(index).length < 30) throw new Error('行政区索引不完整')
console.log(`资源检查通过：${national.features.length} 个省级边界，${boundaries.length} 个省市 GeoJSON 文件。`)
