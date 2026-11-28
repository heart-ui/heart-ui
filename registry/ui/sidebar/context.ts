import type { InjectionKey, Ref } from 'vue'

export interface SidebarContext {
  /** The desktop `nav`'s id, which the trigger controls. */
  navId: () => string
  collapsed: Ref<boolean>
  /** Whether the parts render inside the drawer below 768 px. */
  drawer: boolean
  close: () => void
}

export const sidebarKey: InjectionKey<SidebarContext> = Symbol('sidebar')
