import { getMethod } from "../classes/api";
import { CodeInfo } from "../classes/data";

export type CodeSearchResult = CodeInfo;

export async function searchCodes(query: string, limit: number = 25): Promise<CodeSearchResult[]> {
  return getMethod<CodeSearchResult[]>("/code/search", { query, limit });
}
