/**
 * WebDAV配置验证工具函数
 */

import type { 
  WebDAVConfig, 
  WebDAVConfigError, 
  WebDAVConfigValidationResult 
} from '../../types/webdav';
import { VALIDATION_RULES } from './constants';

/**
 * 验证WebDAV配置
 */
export function validateWebDAVConfig(config: WebDAVConfig): WebDAVConfigValidationResult {
  const errors: WebDAVConfigError[] = [];

  // 验证服务器URL
  if (!config.serverUrl.trim()) {
    errors.push({
      field: 'serverUrl',
      message: '服务器URL不能为空',
      code: 'REQUIRED',
    });
  } else if (!VALIDATION_RULES.urlPattern.test(config.serverUrl)) {
    errors.push({
      field: 'serverUrl',
      message: '请输入有效的URL地址',
      code: 'INVALID_FORMAT',
    });
  }

  // 验证用户名
  if (!config.username.trim()) {
    errors.push({
      field: 'username',
      message: '用户名不能为空',
      code: 'REQUIRED',
    });
  } else if (config.username.length < VALIDATION_RULES.minUsernameLength) {
    errors.push({
      field: 'username',
      message: `用户名长度至少${VALIDATION_RULES.minUsernameLength}个字符`,
      code: 'TOO_SHORT',
    });
  }

  // 验证密码
  if (!config.password) {
    errors.push({
      field: 'password',
      message: '密码不能为空',
      code: 'REQUIRED',
    });
  } else if (config.password.length < VALIDATION_RULES.minPasswordLength) {
    errors.push({
      field: 'password',
      message: `密码长度至少${VALIDATION_RULES.minPasswordLength}个字符`,
      code: 'TOO_SHORT',
    });
  }

  // 验证基础路径
  if (config.basePath && !VALIDATION_RULES.basePathPattern.test(config.basePath)) {
    errors.push({
      field: 'basePath',
      message: '基础路径格式不正确，应以/开头',
      code: 'INVALID_FORMAT',
    });
  }

  // 验证超时时间
  const { min: minTimeout, max: maxTimeout } = VALIDATION_RULES.timeoutRange;
  if (config.timeout < minTimeout || config.timeout > maxTimeout) {
    errors.push({
      field: 'timeout',
      message: `超时时间应在${minTimeout/1000}-${maxTimeout/1000}秒之间`,
      code: 'OUT_OF_RANGE',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
