/**
 * 搜索引擎配置管理
 * 集中管理所有搜索引擎的配置信息
 */

import type { SearchEngineId, SearchEngineConfig } from '@/types/search';

/**
 * 搜索引擎配置列表
 */
export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngineConfig> = {
  google: {
    id: 'google',
    name: 'Google',
    logo: './images/google-logo.png',
    url: 'https://www.google.com/search',
    param: 'q',
    placeholder: '在Google中搜索',
  },
  baidu: {
    id: 'baidu',
    name: '百度',
    logo: './images/baidu-logo.svg',
    url: 'https://www.baidu.com/s',
    param: 'wd',
    placeholder: '在百度中搜索',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    logo: './images/bing-logo.svg',
    url: 'https://www.bing.com/search',
    param: 'q',
    placeholder: '在Bing中搜索',
  },
};

/**
 * 获取搜索引擎配置
 */
export function getSearchEngineConfig(engineId: SearchEngineId): SearchEngineConfig {
  return SEARCH_ENGINES[engineId] || SEARCH_ENGINES.google;
}

/**
 * 获取所有搜索引擎列表
 */
export function getAllSearchEngines(): SearchEngineConfig[] {
  return Object.values(SEARCH_ENGINES);
}

/**
 * 生成搜索URL
 */
export function generateSearchUrl(engineId: SearchEngineId, query: string): string {
  const engine = getSearchEngineConfig(engineId);
  return `${engine.url}?${engine.param}=${encodeURIComponent(query)}`;
}
