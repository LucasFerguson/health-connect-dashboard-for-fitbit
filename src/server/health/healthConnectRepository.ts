import { z } from "zod";
import type { SleepSession, SleepStageKind } from "~/domain/health";
import type { HealthRepository } from "./healthRepository";

const stageSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  stage: z.number().int(),
});

const sleepSessionSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  app: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  data: z.object({
    notes: z.string().nullable().optional().default(null),
    title: z.string().nullable().optional().default(null),
    stages: z.array(stageSchema).optional().default([]),
  }),
});

const sleepSessionsSchema = z.array(sleepSessionSchema);

type SleepSessionDto = z.infer<typeof sleepSessionSchema>;

const stageKinds: Record<number, SleepStageKind> = {
  1: "awake",
  2: "asleep",
  3: "unknown",
  4: "light",
  5: "deep",
  6: "rem",
};

export function mapSleepSession(dto: SleepSessionDto): SleepSession {
  return {
    id: dto.id,
    source: dto.app,
    startAt: dto.start,
    endAt: dto.end,
    title: dto.data.title,
    notes: dto.data.notes,
    stages: dto.data.stages.map((stage) => ({
      startAt: stage.startTime,
      endAt: stage.endTime,
      kind: stageKinds[stage.stage] ?? "unknown",
    })),
  };
}

interface HealthConnectRepositoryOptions {
  baseUrl: string;
  username: string;
  password: string;
}

export class HealthConnectRepository implements HealthRepository {
  constructor(private readonly options: HealthConnectRepositoryOptions) {}

  async getSleepSessions(): Promise<SleepSession[]> {
    const token = await this.login();
    const response = await fetch(
      `${this.options.baseUrl}/api/v2/fetch/sleepSession`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queries: {} }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Health Connect returned ${response.status}`);
    }

    const payload: unknown = await response.json();
    return sleepSessionsSchema.parse(payload).map(mapSleepSession);
  }

  private async login(): Promise<string> {
    const response = await fetch(`${this.options.baseUrl}/api/v2/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.options.username,
        password: this.options.password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Health Connect login returned ${response.status}`);
    }

    const payload = z
      .object({ token: z.string() })
      .parse(await response.json());
    return payload.token;
  }
}
