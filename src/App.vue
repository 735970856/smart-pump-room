<template>
  <el-config-provider :locale="zhCn">
    <main id="viewport">
      <div id="app" :data-page="page" data-view="map" :style="appStyle">
        <LoginPage v-if="page === 'login'" @logged-in="login" />
        <DashboardPage :active="page === 'dashboard'" v-show="page === 'dashboard'" @logout="logout" />
      </div>
    </main>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import LoginPage from './views/LoginPage.vue'
import DashboardPage from './views/DashboardPage.vue'

const SESSION_KEY = 'smart-pump-demo-auth'
type Page = 'login' | 'dashboard'
const hasSession = () => sessionStorage.getItem(SESSION_KEY) === '1'
const initialPage = new URLSearchParams(location.search).get('view')
const page = ref<Page>(hasSession() && initialPage !== 'login' ? 'dashboard' : 'login')
const layout = ref({ scale: 1, left: 0, top: 0 })
const appStyle = computed(() => ({
  transform: `scale(${layout.value.scale})`,
  left: `${layout.value.left}px`,
  top: `${layout.value.top}px`,
}))
function resize() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080)
  layout.value = { scale, left: (innerWidth - 1920 * scale) / 2, top: (innerHeight - 1080 * scale) / 2 }
}
function setPage(next: Page, replace = false) {
  page.value = next
  const url = new URL(location.href)
  url.searchParams.set('view', next)
  history[replace ? 'replaceState' : 'pushState']({ view: next }, '', url.pathname + url.search + url.hash)
  document.title = next === 'login' ? '登录 · 智慧泵房' : '智慧泵房 · 全国数字孪生监管平台'
}
function login() { sessionStorage.setItem(SESSION_KEY, '1'); setPage('dashboard') }
function logout() { sessionStorage.removeItem(SESSION_KEY); setPage('login', true) }
function popstate() {
  const requested = new URLSearchParams(location.search).get('view')
  page.value = hasSession() && requested === 'dashboard' ? 'dashboard' : 'login'
}
onMounted(() => {
  resize()
  addEventListener('resize', resize)
  addEventListener('popstate', popstate)
  document.title = page.value === 'login' ? '登录 · 智慧泵房' : '智慧泵房 · 全国数字孪生监管平台'
})
onBeforeUnmount(() => {
  removeEventListener('resize', resize)
  removeEventListener('popstate', popstate)
})
</script>
