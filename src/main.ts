import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './styles/tailwind.css'
import './console.css'
import './login.css'
import './styles/overrides.css'
import App from './App.vue'

createApp(App).use(ElementPlus, { locale: zhCn, size: 'default' }).mount('#vue-root')
