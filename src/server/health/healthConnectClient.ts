import { z } from "zod";

interface HealthConnectClientOptions {
  baseUrl: string;
  username: string;
  password: string;
}

export class HealthConnectClient {
  private token: string | null = null;

  constructor(private readonly options: HealthConnectClientOptions) {}

  async fetchRecords<T>(
    method: string,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(
      `${this.options.baseUrl}/api/v2/fetch/${method}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queries: {} }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      throw new Error(`Health Connect ${method} returned ${response.status}`);
    }
    const payload: unknown = await response.json();
    return parse(payload);
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const response = await fetch(`${this.options.baseUrl}/api/v2/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.options.username,
        password: this.options.password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Health Connect login returned ${response.status}`);
    }
    this.token = z
      .object({ token: z.string() })
      .parse(await response.json()).token;
    return this.token;
  }
}
