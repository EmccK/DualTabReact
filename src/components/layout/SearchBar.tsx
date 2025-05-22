import React, { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = "搜索 Google 或输入网址",
  onSearch
}) => {
  const [query, setQuery] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // 判断是否为URL
      if (query.includes('.') && !query.includes(' ')) {
        // 简单URL检测，直接跳转
        const url = query.startsWith('http') ? query : `https://${query}`
        window.location.href = url
      } else {
        // Google搜索
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
        window.location.href = searchUrl
      }
      onSearch?.(query)
    }
  }, [query, onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }, [handleSubmit])

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-12 pr-20 h-14 text-lg bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300 transition-all duration-200 shadow-lg"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 px-4"
            disabled={!query.trim()}
          >
            搜索
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SearchBar
