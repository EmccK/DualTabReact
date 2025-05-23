import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, Check, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { theme, themeClasses } from '@/styles/theme'

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  className?: string
}

export function ColorPicker({
  selectedColor,
  onColorChange,
  className
}: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#4F46E5')

  const handlePresetColorSelect = useCallback((color: string) => {
    onColorChange(color)
    setShowCustomPicker(false)
  }, [onColorChange])

  const handleCustomColorClick = useCallback(() => {
    setShowCustomPicker(!showCustomPicker)
  }, [showCustomPicker])

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value)
  }, [])

  const handleCustomColorConfirm = useCallback(() => {
    onColorChange(customColor)
    setShowCustomPicker(false)
  }, [customColor, onColorChange])

  const handleCustomColorCancel = useCallback(() => {
    setShowCustomPicker(false)
  }, [])

  return (
    <div className={cn("space-y-2", className)}>
      {/* 预设颜色选择 - 紧凑的网格布局 */}
      <div className="grid grid-cols-4 gap-2">
        {theme.bookmarkColors.slice(0, 6).map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => handlePresetColorSelect(color.value)}
            className={cn(
              "w-full h-10 relative overflow-hidden rounded-md border-2 transition-all duration-200 hover:scale-105",
              selectedColor === color.value 
                ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md"
                : "border-[#E5E7EB] hover:border-[#4F46E5]/50 shadow-sm"
            )}
            title={color.name}
          >
            <div className={cn("w-full h-full", color.class)}>
              {color.value === 'pattern' && (
                <div className="w-full h-full opacity-60" 
                     style={{
                       backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                       backgroundSize: '6px 6px',
                       backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                     }} 
                />
              )}
              {color.value === 'transparent' && (
                <div className="w-full h-full opacity-60" 
                     style={{
                       backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                       backgroundSize: '6px 6px',
                       backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                     }} 
                />
              )}
            </div>
            {selectedColor === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 text-[#4F46E5]" />
                </div>
              </div>
            )}
          </button>
        ))}
        
        {/* 显示更多颜色按钮 */}
        <button
          type="button"
          onClick={handleCustomColorClick}
          className={cn(
            "w-full h-10 rounded-md border-2 border-dashed transition-all duration-200 hover:scale-105 flex items-center justify-center",
            showCustomPicker 
              ? "border-[#4F46E5] bg-[#4F46E5]/5" 
              : "border-[#E5E7EB] hover:border-[#4F46E5]/50 bg-[#FAFBFC]"
          )}
          title="更多颜色"
        >
          <Plus className="w-4 h-4 text-[#4F46E5]" />
        </button>
      </div>

      {/* 额外颜色选项 */}
      {showCustomPicker && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {theme.bookmarkColors.slice(6).map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handlePresetColorSelect(color.value)}
                className={cn(
                  "w-full h-10 relative overflow-hidden rounded-md border-2 transition-all duration-200 hover:scale-105",
                  selectedColor === color.value 
                    ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-md"
                    : "border-[#E5E7EB] hover:border-[#4F46E5]/50 shadow-sm"
                )}
                title={color.name}
              >
                <div className={cn("w-full h-full", color.class)}>
                  {color.value === 'pattern' && (
                    <div className="w-full h-full opacity-60" 
                         style={{
                           backgroundImage: 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                           backgroundSize: '6px 6px',
                           backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                         }} 
                    />
                  )}
                </div>
                {selectedColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 text-[#4F46E5]" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* 自定义颜色输入 */}
          <div className="flex items-center space-x-2 p-2 bg-[#FAFBFC] border border-[#E5E7EB] rounded-lg">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-8 h-8 rounded border-0 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#4F46E5"
              className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 bg-white"
            />
            <Button
              type="button"
              onClick={handleCustomColorConfirm}
              className="px-3 py-1 h-8 text-xs bg-[#4F46E5] hover:bg-indigo-700 text-white"
            >
              确认
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
