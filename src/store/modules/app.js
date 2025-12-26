import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    device: 'desktop'
  }),

  getters: {
    isMobile: (state) => state.device === 'mobile'
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed
    },

    setDevice(device) {
      this.device = device
    }
  }
})