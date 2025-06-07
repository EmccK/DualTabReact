export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false
  }
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getUrlDomain(url: string): string | null {
  if (!isValidUrl(url)) {
    return null
  }
  
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function formatUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  const trimmedUrl = url.trim()
  if (!trimmedUrl) {
    return ''
  }
  
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl
  }
  
  if (trimmedUrl.startsWith('localhost') || 
      trimmedUrl.startsWith('127.0.0.1') || 
      /^\d+\.\d+\.\d+\.\d+/.test(trimmedUrl)) {
    return `http://${trimmedUrl}`
  }
  
  return `https://${trimmedUrl}`
}export function safeOpenUrl(url: string, target: string = '_blank'): void {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return
  }
  
  const formattedUrl = formatUrl(url)
  if (!isValidUrl(formattedUrl)) {
    return
  }
  
  try {
    window.open(formattedUrl, target, 'noopener,noreferrer')
  } catch {
    // Ignore window.open errors
  }
}