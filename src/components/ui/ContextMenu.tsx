import React from 'react'
import type { ContextMenuState, ContextMenuItem } from '@/hooks/useContextMenu'

interface ContextMenuProps {
  contextMenu: ContextMenuState
  onClose: () => void
}

export function ContextMenu({ contextMenu, onClose }: ContextMenuProps) {
  if (!contextMenu.visible || contextMenu.items.length === 0) {
    return null
  }

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick()
      onClose()
    }
  }

  return (
    <>
      {/* 点击遮罩层关闭菜单 */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      
      {/* 右键菜单 */}
      <div
        key={`context-menu-${contextMenu.targetId}`}
        data-context-menu="true"
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-32 animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          left: contextMenu.x,
          top: contextMenu.y,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {contextMenu.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors duration-150
              ${item.disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : item.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
