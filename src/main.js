import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// ── Styles ──────────────────────────────────────────────────
import '@/assets/main.css'
import '@/assets/styles/filter-bar-responsive.css'
import '@/assets/styles/stat-strip-responsive.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'primeicons/primeicons.css'
import 'vue-datepicker-next/index.css'

// ── PrimeVue ─────────────────────────────────────────────────
import PrimeVue from 'primevue/config'
import { initTheme } from '@/composables/useAppTheme'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import Ripple from 'primevue/ripple'

// ── Stores ───────────────────────────────────────────────────
import { useConfigStore, useAuthStore } from '@/stores/config'

// ── Layout components ─────────────────────────────────────────
import NavBar from '@/layouts/NavBar.vue'
import Sidebar from '@/layouts/SideBar.vue'

// ── App components ────────────────────────────────────────────
import ContentHeader from '@/components/ContentHeader.vue'
import LoadingOverlay from '@/components/LoadingFormCompnent.vue'
import FilterBarCollapsible from '@/components/FilterBarCollapsible.vue'

// ── Reusable UI components ────────────────────────────────────
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppDataCard from '@/components/ui/AppDataCard.vue'

// ── PrimeVue UI components ────────────────────────────────────
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import DataView from 'primevue/dataview'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import FileUpload from 'primevue/fileupload'
import FloatLabel from 'primevue/floatlabel'
import IconField from 'primevue/iconfield'
import Image from 'primevue/image'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputOtp from 'primevue/inputotp'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Panel from 'primevue/panel'
import Password from 'primevue/password'
import Popover from 'primevue/popover'
import ProgressBar from 'primevue/progressbar'
import RadioButton from 'primevue/radiobutton'
import Row from 'primevue/row'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Step from 'primevue/step'
import StepItem from 'primevue/stepitem'
import StepList from 'primevue/steplist'
import StepPanel from 'primevue/steppanel'
import StepPanels from 'primevue/steppanels'
import Stepper from 'primevue/stepper'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'

// ── Third-party ───────────────────────────────────────────────
import { VueReCaptcha } from 'vue-recaptcha-v3'
import datepicker from 'vue-datepicker-next'

// ════════════════════════════════════════════════════════════
//  PrimeVue Preset — dibangun dari pilihan tema user (tersimpan di localStorage),
//  default Aura + Sky ("Sky Clinical"). Lihat composables/useAppTheme.js.
// ════════════════════════════════════════════════════════════
const initialPreset = initTheme()

// ════════════════════════════════════════════════════════════
//  App bootstrap
// ════════════════════════════════════════════════════════════
const pinia = createPinia()
const app   = createApp(App)

app.use(pinia)
app.use(router)

app.use(PrimeVue, {
  ripple: true,
  // z-index dikelola otomatis PrimeVue (overlay selalu di atas dialog). Jangan dipaksa lewat CSS.
  zIndex: { modal: 1100, overlay: 1100, menu: 1100, tooltip: 1200 },
  theme: {
    preset: initialPreset,
    options: {
      prefix:           'p',
      darkModeSelector: 'false', // force light mode
      cssLayer:         true,
    },
  },
})

app.use(ConfirmationService)
app.use(ToastService)
app.use(VueReCaptcha, { siteKey: '' })

// ── Directives ────────────────────────────────────────────────
app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

// ── Global components ─────────────────────────────────────────
// Layout
app.component('NavBar', NavBar)
app.component('Sidebar', Sidebar)

// App
app.component('ContentHeader', ContentHeader)
app.component('loading_overlay', LoadingOverlay)
app.component('FilterBarCollapsible', FilterBarCollapsible)

// UI reusable
app.component('AppPageHeader', AppPageHeader)
app.component('AppStatCard', AppStatCard)
app.component('AppDataCard', AppDataCard)

// Third-party
app.component('date-picker', datepicker)

// PrimeVue
app.component('Accordion', Accordion)
app.component('AccordionContent', AccordionContent)
app.component('AccordionHeader', AccordionHeader)
app.component('AccordionPanel', AccordionPanel)
app.component('Avatar', Avatar)
app.component('Button', Button)
app.component('ButtonGroup', ButtonGroup)
app.component('Card', Card)
app.component('Checkbox', Checkbox)
app.component('Column', Column)
app.component('ColumnGroup', ColumnGroup)
app.component('ConfirmDialog', ConfirmDialog)
app.component('DataTable', DataTable)
app.component('DataView', DataView)
app.component('Dialog', Dialog)
app.component('Divider', Divider)
app.component('FileUpload', FileUpload)
app.component('FloatLabel', FloatLabel)
app.component('IconField', IconField)
app.component('Image', Image)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('InputIcon', InputIcon)
app.component('InputNumber', InputNumber)
app.component('InputOtp', InputOtp)
app.component('InputText', InputText)
app.component('Menu', Menu)
app.component('Menubar', Menubar)
app.component('Message', Message)
app.component('MultiSelect', MultiSelect)
app.component('Panel', Panel)
app.component('Password', Password)
app.component('Popover', Popover)
app.component('ProgressBar', ProgressBar)
app.component('RadioButton', RadioButton)
app.component('Row', Row)
app.component('Select', Select)
app.component('SelectButton', SelectButton)
app.component('Step', Step)
app.component('StepItem', StepItem)
app.component('StepList', StepList)
app.component('StepPanel', StepPanel)
app.component('StepPanels', StepPanels)
app.component('Stepper', Stepper)
app.component('Tab', Tab)
app.component('TabList', TabList)
app.component('TabPanel', TabPanel)
app.component('TabPanels', TabPanels)
app.component('Tabs', Tabs)
app.component('Tag', Tag)
app.component('Textarea', Textarea)
app.component('Toast', Toast)

// ── Axios interceptors ────────────────────────────────────────
const configStore = useConfigStore()

// Request: sisipkan Bearer token ke semua request apotek
axios.interceptors.request.use((config) => {
  if (config.url?.includes(configStore.apiApotikUrl)) {
    const token = localStorage.getItem('apotekToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: 401 dari apotek → auto logout & redirect
// (endpoint /auth/login dikecualikan — 401 di situ = salah password)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url          = error.config?.url || ''
    const isApotek     = url.includes(configStore.apiApotikUrl)
    const isLoginRoute = url.includes('/auth/login')
    if (isApotek && !isLoginRoute && error.response?.status === 401) {
      useAuthStore().clearAuthData()
      const router = app.config.globalProperties.$router
      if (router?.currentRoute?.value?.path !== '/login') {
        sessionStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
        router.push('/login')
      }
    }
    return Promise.reject(error)
  },
)

app.mount('#app')
