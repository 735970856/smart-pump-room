<template>
  <section id="login-screen" aria-label="智慧泵房登录">
    <div class="login-decor one" aria-hidden="true"></div>
    <div class="login-decor two" aria-hidden="true"></div>
    <header class="login-brandbar">
      <div class="login-brand">
        <svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 3S5 20 5 30a15 15 0 0 0 30 0C35 20 20 3 20 3Z"/><path d="m11 30 6-8 6 14 7-12M8 39h24"/></svg>
        <div><strong>智慧泵房</strong><small>SMART PUMP ROOM · DIGITAL TWIN</small></div>
      </div>
      <span class="login-top-note"><i></i>全国智慧供水监管平台</span>
    </header>
    <div class="login-hero">
      <div class="login-eyebrow">CONNECTED WATER · BETTER LIFE</div>
      <h1>连接每一座泵房，<br />守护<span>每一滴好水。</span></h1>
      <p>从全国布局到设备运行，<br />让供水管理更清晰、更高效。</p>
    </div>
    <div ref="mapHost" class="login-map-wrap" aria-hidden="true"></div>
    <div class="login-map-caption"><i></i>全国联动 · 智慧供水</div>
    <section class="login-card account-card" aria-labelledby="login-title">
      <div class="login-eyebrow">ACCOUNT ACCESS</div>
      <h2 id="login-title">欢迎回来</h2>
      <p class="login-subtitle">登录智慧泵房，开启今日供水监管。</p>
      <el-form id="account-login" ref="formRef" :model="form" :rules="rules" label-position="top" :show-message="false" @submit.prevent="submit">
        <el-form-item label="账号" prop="account" :error="errors.account" class="pump-login-item">
          <el-input v-model.trim="form.account" aria-label="账号" placeholder="请输入账号" maxlength="64" autocomplete="username" clearable @input="clear('account')">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" :error="errors.password" class="pump-login-item">
          <el-input v-model="form.password" aria-label="密码" type="password" show-password placeholder="请输入密码" maxlength="128" autocomplete="current-password" @input="clear('password')">
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="图片验证码" prop="captcha" :error="errors.captcha" class="pump-login-item captcha-item">
          <div class="flex w-full items-center gap-3">
            <el-input v-model="form.captcha" class="min-w-0 flex-1" aria-label="图片验证码" placeholder="4 位字符" maxlength="4" autocomplete="off" @input="handleCaptchaInput">
              <template #prefix><el-icon><Key /></el-icon></template>
            </el-input>
            <button type="button" class="login-captcha-image shrink-0" title="点击刷新图片验证码" @click="refreshCaptcha">
              <img :src="captchaUrl" alt="图片验证码（点击刷新）" width="146" height="52" />
            </button>
          </div>
        </el-form-item>
        <div class="login-options mt-1 mb-3">
          <el-checkbox v-model="remember" label="记住账号" />
          <button type="button" class="captcha-refresh-text" @click="refreshCaptcha">看不清？换一张</button>
        </div>
        <p class="login-form-error" role="alert">{{ errors.form || '' }}</p>
        <el-button class="login-primary w-full" native-type="submit" :loading="submitting" :disabled="submitting">
          {{ submitting ? '正在进入平台…' : '登录平台' }} <el-icon class="ml-2"><Right /></el-icon>
        </el-button>
        <div class="login-demo-account"><div><span>演示账号</span><b>demo</b><i>/</i><b>demo1234</b></div><el-button text @click="fillDemo">填入账号</el-button></div>
        <p class="account-demo-note">当前为演示登录，正式账号需连接业务登录服务</p>
      </el-form>
    </section>
    <footer class="login-foot"><span>© 2026 智慧泵房 · 全国数字孪生监管平台</span><span>安全 · 高效 · 智能 · 绿色</span></footer>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Key, Right } from '@element-plus/icons-vue'
import { buildLoginMap } from '../LoginScreen.js'
import { DEMO_ACCOUNT, captchaImage, createCaptchaCode, validateDemoLogin } from '../services/auth'
import type { CaptchaChallenge, LoginErrors, LoginValues } from '../services/auth'

const emit = defineEmits<{ 'logged-in': [] }>()
const mapHost = ref<HTMLElement | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<LoginValues>({ account: '', password: '', captcha: '' })
const errors = reactive<LoginErrors>({})
const remember = ref(false)
const captchaUrl = ref('')
const submitting = ref(false)
const challenge = ref<CaptchaChallenge | null>(null)
const storageKey = 'pump-demo-login-account'
const rules: FormRules<LoginValues> = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入图片验证码', trigger: 'blur' }],
}
function clear(field: keyof LoginErrors) { errors[field] = undefined; errors.form = undefined }
function refreshCaptcha() {
  challenge.value = { code: createCaptchaCode(), expiresAt: Date.now() + 120_000, consumed: false }
  captchaUrl.value = captchaImage(challenge.value.code)
  form.captcha = ''
  clear('captcha')
}
function handleCaptchaInput(value: string) {
  form.captcha = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  clear('captcha')
}
function fillDemo() {
  form.account = DEMO_ACCOUNT.username
  form.password = DEMO_ACCOUNT.password
  clear('account'); clear('password')
}
function submit() {
  if (submitting.value) return
  Object.keys(errors).forEach(key => { errors[key as keyof LoginErrors] = undefined })
  const validation = validateDemoLogin(form, challenge.value)
  if (Object.keys(validation).length) {
    Object.assign(errors, validation)
    if (validation.captcha && form.captcha) { refreshCaptcha(); errors.captcha = '验证码有误或已过期，已刷新' }
    return
  }
  if (challenge.value) challenge.value.consumed = true
  if (remember.value) localStorage.setItem(storageKey, form.account.trim())
  else localStorage.removeItem(storageKey)
  submitting.value = true
  form.password = ''
  form.captcha = ''
  // 下一帧再切换路由，允许按钮呈现提交状态。
  requestAnimationFrame(() => {
    submitting.value = false
    emit('logged-in')
  })
}
onMounted(() => {
  if (mapHost.value) buildLoginMap(mapHost.value)
  try { form.account = localStorage.getItem(storageKey) || ''; remember.value = !!form.account } catch { /* 用户关闭了存储 */ }
  refreshCaptcha()
})
</script>
