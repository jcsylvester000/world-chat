// Thin client-side fetch wrappers for the /api layer. Used by the data
// service when NEXT_PUBLIC_DATA_SOURCE === "prisma".
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string): Promise<T> => fetch(path).then((r) => handle<T>(r));

export const apiSend = <T>(path: string, method: string, body?: unknown): Promise<T> =>
  fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r));

// Whether the app reads/writes the listings slice through the Postgres-backed
// API instead of the in-memory mock. Flipped via NEXT_PUBLIC_DATA_SOURCE.
export const USE_PRISMA = process.env.NEXT_PUBLIC_DATA_SOURCE === "prisma";
