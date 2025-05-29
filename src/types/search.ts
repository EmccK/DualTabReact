/**
 * 搜索功能相关类型定义
 */

export type SearchEngineId = 'google' | 'baidu' | 'bing';

export interface SearchOptions {
  openInNewTab: boolean;
  autoFocus: boolean;
}

export interface SearchEngineConfig {
  id: SearchEngineId;
  name: string;
  logo: string;
  url: string;
  param: string;
  placeholder: string;
}

export interface SearchAction {
  query: string;
  engineId: SearchEngineId;
  options: SearchOptions;
}
