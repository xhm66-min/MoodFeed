export interface FetchError {
  status: number;
  message: string;
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error: FetchError = {
      status: response.status,
      message: `请求失败: ${response.status} ${response.statusText}`,
    };
    throw error;
  }

  return response.json() as Promise<T>;
}
