<template>
  <header class="header">
    <div class="brand">
      <div class="brand-symbol">
        <svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 3S5 20 5 30a15 15 0 0 0 30 0C35 20 20 3 20 3Z" /><path d="m11 30 6-8 6 14 7-12M8 39h24" /></svg>
      </div>
      <div><h1>智慧泵房</h1><small>SMART PUMP ROOM · DIGITAL TWIN</small></div>
    </div>
    <div class="header-center"><span></span><h2>全国智慧供水监管平台</h2><span></span><p>安全<span>·</span>高效<span>·</span>智能<span>·</span>绿色</p></div>
    <div class="header-end">
      <span class="demo-badge"><i></i>演示数据</span>
      <div class="date"><b id="clock">{{ dateTime }}</b><small id="weekday">{{ weekday }}</small></div>
      <el-tooltip content="进入/退出全屏" placement="bottom" :show-after="500">
        <button id="full-screen" class="icon-button" title="进入全屏" aria-label="进入全屏" aria-pressed="false">
          <svg data-fullscreen-icon="enter" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" /></svg>
          <svg data-fullscreen-icon="exit" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5" /></svg>
        </button>
      </el-tooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
const dateTime = ref('')
const weekday = ref('')
let interval: ReturnType<typeof setInterval> | undefined
function tick() {
  const now = new Date()
  dateTime.value = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now).replaceAll('/', '-')
  weekday.value = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long' }).format(now)
}
onMounted(() => { tick(); interval = setInterval(tick, 1000) })
onBeforeUnmount(() => { if (interval) clearInterval(interval) })
</script>
