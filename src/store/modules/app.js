import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    device: 'desktop',
    theme: 'light'
  }),
  
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    closeSidebar() {
      this.sidebarCollapsed = true
    },
    
    openSidebar() {
      this.sidebarCollapsed = false
    },
    
    setDevice(device) {
      this.device = device
    },
    
    setTheme(theme) {
      this.theme = theme
      document.documentElement.className = theme === 'dark' ? 'dark' : ''
    }
  }
})
