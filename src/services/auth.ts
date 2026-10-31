/** 本地演示校验；生产环境请改用后端登录接口及服务端验证码。 */
export interface LoginValues { account: string; password: string; captcha: string }
export interface CaptchaChallenge { code: string; expiresAt: number; consumed: boolean }
export type LoginErrors = Partial<Record<keyof LoginValues | 'form', string>>
export const DEMO_ACCOUNT = { username: 'demo', password: 'demo1234' } as const
const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export function createCaptchaCode(): string {
  let code = ''
  const bytes = new Uint8Array(12)
  const limit = Math.floor(256 / alphabet.length) * alphabet.length
  while (code.length < 4) {
    crypto.getRandomValues(bytes)
    for (const n of bytes) {
      if (n < limit) code += alphabet[n % alphabet.length]
      if (code.length === 4) break
    }
  }
  return code
}
export function validateDemoLogin(values: LoginValues, challenge: CaptchaChallenge | null): LoginErrors {
  const errors: LoginErrors = {}
  const account = values.account.trim()
  const captcha = values.captcha.trim().toUpperCase()
  if (!account) errors.account = '请输入账号'
  if (!values.password) errors.password = '请输入密码'
  if (!captcha) errors.captcha = '请输入图片验证码'
  else if (!challenge || challenge.consumed || Date.now() >= challenge.expiresAt) errors.captcha = '验证码已过期，请刷新'
  else if (captcha !== challenge.code) errors.captcha = '验证码不正确，请重新输入'
  if (!Object.keys(errors).length && (account !== DEMO_ACCOUNT.username || values.password !== DEMO_ACCOUNT.password)) {
    errors.form = '账号或密码不正确'
  }
  return errors
}
export function captchaImage(code: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 292
  canvas.height = 104
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const gradient = ctx.createLinearGradient(0, 0, 292, 104)
  gradient.addColorStop(0, '#e6eff1')
  gradient.addColorStop(1, '#d7e6dc')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 292, 104)
  for (let i = 0; i < 23; i++) {
    ctx.fillStyle = i % 2 ? '#b8c9d7' : '#9fbdaf'
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(Math.random() * 292, Math.random() * 104, 1 + Math.random() * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (let i = 0; i < 4; i++) {
    ctx.save()
    ctx.translate(35 + i * 65, 57 + (Math.random() - 0.5) * 12)
    ctx.rotate((Math.random() - 0.5) * 0.27)
    ctx.font = `600 ${45 + Math.round(Math.random() * 5)}px Arial,sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = ['#477b73', '#536f8c', '#547f6b', '#69788e'][i]
    ctx.fillText(code[i] || '', 0, 0)
    ctx.restore()
  }
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i % 2 ? '#96b3be' : '#a9bcb0'
    ctx.globalAlpha = 0.56
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(0, 15 + Math.random() * 70)
    ctx.bezierCurveTo(85, Math.random() * 104, 190, Math.random() * 104, 292, 20 + Math.random() * 70)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}
