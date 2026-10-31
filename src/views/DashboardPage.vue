<template>
  <div id="dashboard" :aria-hidden="!active">
<div class="ambient"></div><div class="grid-floor"></div>
 <DashboardHeader />
 <section class="stat-strip" id="stats" aria-label="运行统计"></section>
 <aside class="glass left-panel" id="left-panel" aria-label="泵房与设备列表"></aside>
 <section class="center-area"><div class="center-heading"><div><div class="eyebrow" id="eyebrow">NATIONAL WATER NETWORK</div><div class="breadcrumbs" id="breadcrumbs"></div></div><div class="scene-tools"><button id="up-region" class="small-button" hidden>‹ 返回上级</button><button id="back-map" class="small-button" hidden>‹ 返回分布地图</button><select id="interior-view" class="interior-view" aria-label="选择室内视角" hidden><option value="overview">室内总览</option><option value="front">正面平视</option><option value="pumps">泵组近景</option><option value="cabinet">配电柜</option></select><button id="reset-view" class="tool-button" title="重置视角" aria-label="重置视角"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4v6h-6M20 10a8 8 0 1 0-1 7"/></svg></button><button id="toggle-labels" class="tool-button active" title="显示或隐藏标签" aria-label="显示或隐藏标签"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4h8l9 9-7.5 7.5-9.5-9.5Z"/><circle cx="8" cy="8.5" r="1"/></svg></button><button id="toggle-rotate" class="tool-button" title="自动环顾" aria-label="自动环顾"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v8H8zM3 15c0-2 4-4 9-4s9 2 9 4-4 4-9 4c-3 0-6-1-7.5-2M3 12v4h4"/></svg></button></div></div>
  <div class="scene-area" id="scene-area"><canvas id="scene-canvas" aria-label="中国三维地图，可点击城市或省份查看泵房" role="img"></canvas><div id="scene-labels" class="scene-labels"></div><div id="map-tooltip" class="map-tooltip"></div><div class="map-scan-frame" aria-hidden="true"><span class="map-scan-corner tl"></span><span class="map-scan-corner tr"></span><span class="map-scan-corner bl"></span><span class="map-scan-corner br"></span><span class="map-scan-beam"></span></div><div class="loading" id="scene-loading"><span></span>正在初始化三维场景…</div><div class="scene-fallback" id="scene-fallback" hidden><b>当前浏览器无法开启 WebGL</b><p>仍可通过左侧省市和泵房列表查看设备参数。建议在支持 WebGL 的 Chrome 或 Edge 中打开。</p></div></div>
  <div class="scene-bottom"><div class="scene-legend" id="scene-legend"><span><i class="dot normal"></i>运行正常</span><span><i class="dot alarm"></i>存在告警</span><span><i class="dot offline"></i>设备离线</span></div><span id="scene-hint">点击省份筛选 · 点击城市查看泵房 · 滚轮缩放</span></div><div class="map-caption" id="map-caption">中国 · 省级行政区划 <span>CHINA / PROVINCE VIEW</span></div>
 </section>
 <aside class="right-panel" id="right-panel" aria-label="运行信息与设备详情"></aside>
 <footer class="footer"><div class="connection"><i></i><span>本地演示模式</span><small id="scene-status">3D 引擎初始化中</small></div><nav class="nav" aria-label="主导航"><button class="nav-item active" data-nav="map"><span>◈</span>全国总览</button><button class="nav-item" data-nav="room"><span>⬡</span>泵房 3D</button><button class="nav-item" data-nav="alarms"><span>♧</span>告警中心</button><button class="nav-item" data-nav="energy"><span>▥</span>能效分析</button><button class="nav-item" data-nav="settings"><span>⚙</span>系统设置</button></nav><div class="footer-note">SMART WATER · INTELLIGENT LIFE</div></footer>
 <div class="toast" id="toast" role="status" aria-live="polite"></div><div class="modal-mask" id="modal-mask" hidden><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title"></h2><button class="icon-button" id="close-modal" aria-label="关闭"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></header><div id="modal-body"></div></section></div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, watch } from 'vue'
import DashboardHeader from '../components/DashboardHeader.vue'

const props = defineProps<{ active: boolean }>()
const emit = defineEmits<{ logout: [] }>()

// 现有的复杂三维场景/行政区绘图保留为过渡引擎，逐步转换为类型化 composables。
// Vue 管理页面的显示周期和登录状态，三维引擎仅在首次进入大屏时加载。
type LegacyController = { activate: () => void; deactivate: () => void; dispose: () => void }
let controller: LegacyController | undefined
let destroyed = false
let loading = false
watch(() => props.active, async (active) => {
  if (!active) { controller?.deactivate(); return }
  await nextTick()
  if (controller) { controller.activate(); return }
  if (loading) return
  loading = true
  try {
    const module = await import('../legacy-dashboard.js')
    if (destroyed || !props.active) return
    controller = module.mountLegacyDashboard(() => emit('logout')) as LegacyController
  } catch (error) {
    console.error('三维监管场景加载失败', error)
    const status = document.getElementById('scene-status')
    if (status) status.textContent = '场景加载失败，请刷新重试'
  } finally { loading = false }
}, { immediate: true })

onBeforeUnmount(() => { destroyed = true; controller?.dispose() })
</script>
