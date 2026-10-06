const API =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export type Run = {
  id: string;
  created_at: string;
  cpu_label: string;
  browser: string;
  os_label: string;
  logical_cores: number;
  overall_score: number;
  categories: Record<
    string,
    {
      score: number;
      duration_ms: number;
      throughput: number;
      unit: string;
      speedup?: number;
      efficiency?: number;
    }
  >;
  benchmark_version: string;
  input_config: Record<string, unknown>;
};

async function request(
  path: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem(
    "cpu_performance_analyzer_token"
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let data: any = {};

    try {
      data = await response.json();
    } catch {
      // Response was not JSON
    }

    let message = `Request failed (${response.status})`;

    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map(
          (item: any) =>
            item.msg ||
            item.message ||
            JSON.stringify(item)
        )
        .join(", ");
    } else if (
      typeof data.detail === "object" &&
      data.detail !== null
    ) {
      message =
        data.detail.message ||
        data.detail.msg ||
        JSON.stringify(data.detail);
    } else if (typeof data === "string") {
      message = data;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Authentication
  register: (
    name: string,
    email: string,
    password: string
  ) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }),

  login: (
    email: string,
    password: string
  ) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  me: () =>
    request("/auth/me"),

  // Benchmark runs
  runs: () =>
    request("/runs"),

  saveRun: (
    run: Omit<Run, "id" | "created_at">
  ) =>
    request("/runs", {
      method: "POST",
      body: JSON.stringify(run),
    }),

  deleteRun: (id: string) =>
    request(`/runs/${id}`, {
      method: "DELETE",
    }),

  // Backend health
  health: () =>
    request("/health"),
};

export { API };