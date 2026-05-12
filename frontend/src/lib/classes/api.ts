/**
 *
 */
import HTTPError from "./httpError";
import type { HttpErrorCode } from "./httpError";

const envApiUrl =
  typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : typeof process !== "undefined"
      ? (process as any)?.env?.REACT_APP_API_URL
      : "";

export const baseURL = envApiUrl ?? "/api";
const API_PREFIX = "/api/v1";

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter = () => localStorage.getItem("token");
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerAuthTokenGetter(getter: TokenGetter) {
  tokenGetter = getter;
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function normalizePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  if (cleaned.startsWith("/api/")) return cleaned;
  return `${API_PREFIX}${cleaned}`;
}

export function buildApiUrl(path: string, queryParams?: {[key: string]: any}): string {
  const url = baseURL + normalizePath(path);
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return url;
  }

  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function getMethod<Type>(
  path: string,
  queryParams?: {[key: string]: string | number | boolean},
  options?: { includeAuth?: boolean; handleUnauthorized?: boolean }
): Promise<Type> {
  const includeAuth = options?.includeAuth ?? true;
  const handleUnauthorized = options?.handleUnauthorized ?? true;
  const requestOptions: { [key: string]: any } = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  }
  const token = includeAuth ? tokenGetter() : null;
  if (token) {
    requestOptions.headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(buildApiUrl(path, queryParams), requestOptions);
  if (!response.ok) {
    if (response.status === 401 && handleUnauthorized && unauthorizedHandler) unauthorizedHandler();
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return response.json() as Type;
}

export async function postMethod<Type>(
  path: string,
  data: { [key: string]: any },
  options?: { includeAuth?: boolean; handleUnauthorized?: boolean; queryParams?: { [key: string]: string | number | boolean } }
): Promise<Type> {
  const includeAuth = options?.includeAuth ?? true;
  const handleUnauthorized = options?.handleUnauthorized ?? true;
  const request = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    } as Record<string, string>,
    body: JSON.stringify(data),
  };
  const token = includeAuth ? tokenGetter() : null;
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path, options?.queryParams), request);
  if (!response.ok) {
    if (response.status === 401 && handleUnauthorized && unauthorizedHandler) unauthorizedHandler();
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return response.json() as Type;
}

export async function postFormMethod<Type>(
  path: string,
  formData: FormData,
  options?: { includeAuth?: boolean; handleUnauthorized?: boolean; queryParams?: { [key: string]: string | number | boolean } }
): Promise<Type> {
  const includeAuth = options?.includeAuth ?? false;
  const handleUnauthorized = options?.handleUnauthorized ?? true;
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  const token = includeAuth ? tokenGetter() : null;
  if (includeAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path, options?.queryParams), {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401 && handleUnauthorized && unauthorizedHandler) unauthorizedHandler();
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }

  const responseText = await response.text();
  if (!responseText) return {} as Type;

  try {
    return JSON.parse(responseText) as Type;
  } catch (error) {
    console.warn("Response is not JSON, returning empty object.");
    return {} as Type;
  }
}

export async function patchMethod<Type>(
  path: string,
  data: { [key: string]: any },
  options?: { includeAuth?: boolean; queryParams?: { [key: string]: string | number | boolean } }
): Promise<Type> {
  const includeAuth = options?.includeAuth ?? true;
  const request = {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    } as Record<string, string>,
    body: JSON.stringify(data),
  };
  const token = includeAuth ? tokenGetter() : null;
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path, options?.queryParams), request);
  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler();
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return response.json() as Type;
}

export async function deleteMethod(
  path: string,
  options?: { includeAuth?: boolean }
): Promise<void> {
  const includeAuth = options?.includeAuth ?? true;
  const headers: Record<string, string> = { accept: "application/json" };
  const token = includeAuth ? tokenGetter() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers,
  });
  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler();
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
}

export async function getBlob(path: string, queryParams?: { [key: string]: string | number }): Promise<Blob> {
  const options = {
    method: "GET",
    headers: {
      accept: "*/*",
    },
  };
  const response = await fetch(buildApiUrl(path, queryParams), options);
  if (!response.ok) {
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return await response.blob();
}
