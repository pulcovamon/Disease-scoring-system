/**
 *
 */
import HTTPError from "./httpError";
import type { HttpErrorCode } from "./httpError";

export const baseURL = process.env.REACT_APP_API_URL;

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

export async function getMethod<Type>(path: string, queryParams?: {[key: string]: string | number | boolean}): Promise<Type> {
  const options: { [key: string]: any } = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  }
  const token = localStorage.getItem("token");
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(getUrl(path, queryParams), options);
  if (!response.ok) {
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return response.json() as Type;
}

export async function postMethod<Type>(
  path: string,
  data: { [key: string]: any }
): Promise<Type> {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(baseURL+path, options);
  if (!response.ok) {
    throw new HTTPError({ code: response.status as HttpErrorCode });
  }
  return response.json() as Type;
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
