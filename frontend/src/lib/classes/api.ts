/**
 * 
 */
import HTTPError from "./httpError";
import type { HttpErrorCode } from "./httpError";

const baseURL = "/";

export async function getMethod<Type>(path: string): Promise<Type> {
    const options = {
        method: "GET",
        headers: {
            accept: "application/json"
        }
    }
    const response = await fetch(new URL(path, baseURL), options);
    if (!response.ok) {
        throw new HTTPError({ code: response.status as HttpErrorCode });
    }
    return response.json();
}


export async function postMethod<Type>(path: string, data: {[key: string]: any}): Promise<Type> {
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            'Content-Type': 'application/json',
            body: JSON.stringify(data),
        }
    }
    const response = await fetch(new URL(path, baseURL), options);
    if (!response.ok) {
        throw new HTTPError({ code: response.status as HttpErrorCode });
    }
    return response.json();
}