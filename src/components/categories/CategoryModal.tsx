import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import type { BookmarkCategory } from '@/types'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  category?: BookmarkCategory
  onSave: (categoryData: Omit<BookmarkCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate: (id: string, updates: Partial<BookmarkCategory>) => Promise<void>
}

const PRESET_ICONS = ['🏠', '💼', '🎯', '📚', '🛠️', '🎮', '🎵', '📱', '💻', '🌐']
const PRESET_COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#D97706']

export function CategoryModal({ isOpen, onClose, mode, category, onSave, onUpdate }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁',
    color: '#4F46E5',
    bookmarks: [] as string[]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        bookmarks: category.bookmarks
      })
    } else {
      setFormData({
        name: '',
        icon: '📁',
        color: '#4F46E5',
        bookmarks: []
      })
    }
  }, [mode, category, isOpen])

  const handleSave = async () => {
    if (!formData.name.trim()) return
    
    setLoading(true)
    try {
      if (mode === 'add') {
        await onSave(formData)
      } else if (mode === 'edit' && category) {
        await onUpdate(category.id, formData)
      }
      onClose()
    } catch {
      // Ignore category save errors
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '添加分类' : '编辑分类'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2 block">分类名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入分类名称"
            />
          </div>
          
          <div>
            <Label>图标</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {PRESET_ICONS.map((icon) => (
                <Button
                  key={icon}
                  variant={formData.icon === icon ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className="h-10 text-lg"
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label>颜色</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className="h-8 p-0"
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && <span className="text-white">✓</span>}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}