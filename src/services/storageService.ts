/**
 * 存储服务-负责本地数据读写
 **/
export const storageService = {
  /**
   * 从 localStorage 读取数据，并尝试解析为指定类型
   * @param key 存储键名
   * @returns 解析后的数据，如果不存在或解析失败则返回 null
   */
  load<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`storageService解析失败`);
      return null;
    }
  },

  /**
   * 保存数据到 localStorage
   * @param key 存储键名
   * @param data 要存储的数据
   */

  save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`[storageService] 保存 ${key} 失败:`, error);
    }
  },

  /**
   * 删除指定 key 的数据
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * 清空所有数据（慎用）
   */

  clear(): void {
    localStorage.clear();
  },
};
