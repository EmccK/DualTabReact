import { useState, useCallback, useEffect, useRef } from 'react'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  targetId: string | null
}

export interface UseContextMenuOptions {
  menuWidth?: number
  menuHeight?: number
  closeOnScroll?: boolean
  closeOnResize?: boolean
}

export function useContextMenu(options: UseContextMenuOptions = {}) {
  const {
    menuWidth = 128,
    menuHeight = 80,
    closeOnScroll = true,
    closeOnResize = true
  } = options

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    targetId: null
  })

  const timeoutRef = useRef<NodeJS.Timeout>()

  // 计算菜单位置，确保不超出屏幕边界
  const calculateMenuPosition = useCallback((event: React.MouseEvent | MouseEvent) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = event.clientX
    let y = event.clientY
    
    // 右边界检查
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10
    }
    
    // 下边界检查
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10
    }
    
    // 左边界检查
    if (x < 10) {
      x = 10
    }
    
    // 上边界检查
    if (y < 10) {
      y = 10
    }
    
    return { x, y }
  }, [menuWidth, menuHeight])

  // 显示右键菜单
  const showContextMenu = useCallback((
    event: React.MouseEvent | MouseEvent,
    items: ContextMenuItem[],
    targetId: string
  ) => {
    event.preventDefault()
    event.stopPropagation()
    
    // 清除之前的延时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    const { x, y } = calculateMenuPosition(event)
    
    // 如果当前菜单显示的是同一个目标，直接返回
    if (contextMenu.visible && contextMenu.targetId === targetId) {
      return
    }
    
    // 如果当前已有菜单显示且是不同目标，先关闭再打开新的
    if (contextMenu.visible && contextMenu.targetId !== targetId) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      
      timeoutRef.current = setTimeout(() => {
        setContextMenu({
          visible: true,
          x,
          y,
          items,
          targetId
        })
      }, 20)
    } else {
      // 如果当前没有菜单显示，直接显示新菜单
      setContextMenu({
        visible: true,
        x,
        y,
        items,
        targetId
      })
    }
  }, [contextMenu.visible, contextMenu.targetId, calculateMenuPosition])

  // 关闭右键菜单
  const hideContextMenu = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // 全局事件监听
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (contextMenu.visible) {
        const target = event.target as Element
        const menuElement = document.querySelector('[data-context-menu="true"]')
        if (menuElement && !menuElement.contains(target)) {
          hideContextMenu()
        }
      }
    }

    const handleGlobalContextMenu = (event: MouseEvent) => {
      const target = event.target as Element
      const contextTarget = target.closest('[data-context-target]')
      
      // 如果不是在有右键功能的元素上右键，且当前有菜单显示，则关闭菜单
      if (!contextTarget && contextMenu.visible) {
        event.preventDefault()
        hideContextMenu()
      }
    }

    const handleScroll = () => {
      if (closeOnScroll && contextMenu.visible) {
        hideContextMenu()
      }
    }

    const handleResize = () => {
      if (closeOnResize && contextMenu.visible) {
        hideContextMenu()
      }
    }

    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('contextmenu', handleGlobalContextMenu)
    
    if (closeOnScroll) {
      document.addEventListener('scroll', handleScroll, true)
    }
    
    if (closeOnResize) {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('contextmenu', handleGlobalContextMenu)
      document.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [contextMenu.visible, hideContextMenu, closeOnScroll, closeOnResize])

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  }
}
