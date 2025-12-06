/**
 *
 */
import HTTPError from "./httpError";
import type { HttpErrorCode } from "./httpError";

export const baseURL = process.env.REACT_APP_API_URL;

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

function getUrl(path: string, queryParams?: {[key: string]: any}): string {
  let url = baseURL + path;
  if (queryParams) {
    url += "?"
    Object.keys(queryParams).forEach((key, index) => {
      url += [key, queryParams[key]].join("=");
      url += "&";
    });
  }
  return url;
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
  
  const response = await fetch(getUrl(path, queryParams), requestOptions);
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

  const response = await fetch(getUrl(path, options?.queryParams), request);
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

  const response = await fetch(getUrl(path, options?.queryParams), {
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

export async function getBlob(path: string, queryParams?: { [key: string]: string | number }): Promise<Blob> {
  const options = {
    method: "GET",
    headers: {
      accept: "*/*",
    },
  };
  const response = await fetch(getUrl(path, queryParams), options);
  if (!response.ok) {
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return await response.blob();
}
