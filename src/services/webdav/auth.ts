/**
 * WebDAV认证处理模块
 * 处理Basic认证和Bearer token认证
 */

import { DEBUG_ENABLED } from './constants';

/**
 * 认证类型
 */
export type AuthType = 'basic' | 'bearer' | 'digest';

/**
 * 认证配置
 */
export interface AuthConfig {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
}

/**
 * Base64编码工具
 */
function base64Encode(str: string): string {
  try {
    // 在浏览器环境中使用btoa
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    // 降级处理
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * 创建Basic认证头
 */
export function createBasicAuthHeader(username: string, password: string): string {
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }

  const credentials = `${username}:${password}`;
  const encoded = base64Encode(credentials);
  
  if (DEBUG_ENABLED) {
    console.log('[WebDAV Auth] Created Basic auth header for user:', username);
  }
  
  return `Basic ${encoded}`;
}

/**
 * 创建Bearer认证头
 */
export function createBearerAuthHeader(token: string): string {
  if (!token) {
    throw new Error('Token不能为空');
  }

  if (DEBUG_ENABLED) {
    console.log('[WebDAV Auth] Created Bearer auth header');
  }
  
  return `Bearer ${token}`;
}

/**
 * 根据配置创建认证头
 */
export function createAuthHeader(config: AuthConfig): string {
  switch (config.type) {
    case 'basic':
      if (!config.username || !config.password) {
        throw new Error('Basic认证需要提供用户名和密码');
      }
      return createBasicAuthHeader(config.username, config.password);
      
    case 'bearer':
      if (!config.token) {
        throw new Error('Bearer认证需要提供token');
      }
      return createBearerAuthHeader(config.token);
      
    case 'digest':
      throw new Error('暂不支持Digest认证');
      
    default:
      throw new Error(`不支持的认证类型: ${config.type}`);
  }
}

/**
 * 验证认证配置
 */
export function validateAuthConfig(config: AuthConfig): boolean {
  if (!config || typeof config !== 'object') {
    return false;
  }

  if (!config.type || !['basic', 'bearer', 'digest'].includes(config.type)) {
    return false;
  }

  switch (config.type) {
    case 'basic':
      return Boolean(config.username && config.password);
      
    case 'bearer':
      return Boolean(config.token);
      
    case 'digest':
      return false; // 暂不支持
      
    default:
      return false;
  }
}

/**
 * 从WebDAV配置创建认证配置
 */
export function createAuthConfigFromWebDAV(webdavConfig: {
  username: string;
  password: string;
}): AuthConfig {
  return {
    type: 'basic',
    username: webdavConfig.username,
    password: webdavConfig.password,
  };
}

/**
 * 安全地存储认证信息
 * 注意：在Chrome扩展中，密码会被明文存储在local storage
 * 这是Chrome扩展的限制，实际应用中应考虑加密存储
 */
export function sanitizeAuthConfig(config: AuthConfig): AuthConfig {
  const sanitized = { ...config };
  
  // 移除敏感信息用于日志记录
  if (sanitized.password) {
    // 保留前两位和后两位，中间用*替代
    const len = sanitized.password.length;
    if (len > 4) {
      sanitized.password = sanitized.password.substring(0, 2) + 
        '*'.repeat(len - 4) + 
        sanitized.password.substring(len - 2);
    } else {
      sanitized.password = '*'.repeat(len);
    }
  }
  
  if (sanitized.token) {
    const len = sanitized.token.length;
    if (len > 8) {
      sanitized.token = sanitized.token.substring(0, 4) + 
        '*'.repeat(len - 8) + 
        sanitized.token.substring(len - 4);
    } else {
      sanitized.token = '*'.repeat(len);
    }
  }
  
  return sanitized;
}

/**
 * 检查认证错误
 */
export function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * 获取认证错误消息
 */
export function getAuthErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return '认证失败，请检查用户名和密码';
    case 403:
      return '访问被拒绝，权限不足';
    default:
      return '认证相关错误';
  }
}

/**
 * 清理认证缓存
 * 在Chrome扩展环境中，这主要是清理存储的配置
 */
export async function clearAuthCache(): Promise<void> {
  try {
    // 清理可能缓存的认证信息
    await chrome.storage.local.remove([
      'webdav_config',
      'auth_cache',
      'auth_token',
    ]);
    
    if (DEBUG_ENABLED) {
      console.log('[WebDAV Auth] Auth cache cleared');
    }
  } catch (error) {
    console.error('[WebDAV Auth] Failed to clear auth cache:', error);
    throw error;
  }
}

/**
 * 测试认证配置
 * 通过简单的PROPFIND请求测试认证是否有效
 */
export async function testAuthConfig(
  serverUrl: string, 
  authConfig: AuthConfig
): Promise<boolean> {
  try {
    const authHeader = createAuthHeader(authConfig);
    
    // 构造测试URL
    const testUrl = new URL(serverUrl);
    
    const response = await fetch(testUrl.toString(), {
      method: 'PROPFIND',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '0',
      },
      body: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/></D:prop></D:propfind>',
    });

    // 2xx状态码表示认证成功
    const isSuccess = response.status >= 200 && response.status < 300;
    
    if (DEBUG_ENABLED) {
      console.log('[WebDAV Auth] Auth test result:', {
        url: serverUrl,
        status: response.status,
        success: isSuccess,
      });
    }
    
    return isSuccess;
  } catch (error) {
    if (DEBUG_ENABLED) {
      console.error('[WebDAV Auth] Auth test failed:', error);
    }
    return false;
  }
}
