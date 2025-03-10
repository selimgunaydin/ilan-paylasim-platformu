import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const responseClone = res.clone();
    const text = await responseClone.text() || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions<T = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
}

export async function apiRequest<ResponseType = unknown, RequestType = unknown>(
  options: ApiRequestOptions<RequestType>
): Promise<ResponseType> {
  const { url, method, data } = options;

  const res = await fetch(url, {
    method: method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  // Response'u klonla ve hata kontrolü için kullan
  const resForErrorCheck = res.clone();
  await throwIfResNotOk(resForErrorCheck);
  
  // Orijinal response'u JSON olarak çözümle
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
type GetQueryFnOptions = {
  on401?: UnauthorizedBehavior;
};

export function getQueryFn<T>(
  pathOrOptions: string | GetQueryFnOptions,
  options: GetQueryFnOptions = {}
): QueryFunction<T> {
  const path = typeof pathOrOptions === 'string' ? pathOrOptions : '';
  const opts = typeof pathOrOptions === 'string' ? options : pathOrOptions;

  return async ({ queryKey }): Promise<T> => {
    try {
      const endpoint = typeof queryKey[0] === 'string' ? queryKey[0] : path;
      const res = await fetch(endpoint, { 
        credentials: 'include',
        cache: "no-store",
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.error(`Unauthorized access to ${endpoint}`);
          if (opts.on401 === "returnNull") {
            return null as T;
          } else if (opts.on401 === "redirect") {
            window.location.href = "/auth";
            return null as T;
          }
          throw new Error("Unauthorized");
        }
        
        let errorMessage = "API request failed";
        try {
          const responseClone = res.clone();
          const errorText = await responseClone.text();
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error("Error reading response:", e);
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data as T;
    } catch (error) {
      console.error(`API Error (${path}):`, error);
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 dakika
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});