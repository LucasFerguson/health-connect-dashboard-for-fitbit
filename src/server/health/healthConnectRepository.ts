import { z } from "zod";
import type {
  EnergyObservation,
  RawHealthData,
  RestingHeartRateObservation,
  SleepSession,
  SleepStageKind,
  StepsObservation,
  WeightObservation,
} from "~/domain/health";
import { HealthConnectClient } from "./healthConnectClient";
import type { HealthRepository } from "./healthRepository";

const envelopeSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  app: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime().nullable(),
});

const stageSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  stage: z.number().int(),
});

const sleepSessionSchema = envelopeSchema.extend({
  end: z.string().datetime(),
  data: z.object({
    notes: z.string().nullable().optional().default(null),
    title: z.string().nullable().optional().default(null),
    stages: z.array(stageSchema).optional().default([]),
  }),
});
const stepsSchema = envelopeSchema.extend({
  end: z.string().datetime(),
  data: z.object({ count: z.number().int().nonnegative() }),
});
const energySchema = envelopeSchema.extend({
  end: z.string().datetime(),
  data: z.object({
    energy: z.object({ inKilocalories: z.number().nonnegative() }),
  }),
});
const restingHeartRateSchema = envelopeSchema.extend({
  data: z.object({ beatsPerMinute: z.number().positive() }),
});
const weightSchema = envelopeSchema.extend({
  data: z.object({
    weight: z.object({ inKilograms: z.number().positive() }),
  }),
});

const stageKinds: Record<number, SleepStageKind> = {
  1: "awake",
  2: "asleep",
  3: "unknown",
  4: "light",
  5: "deep",
  6: "rem",
};

export class HealthConnectRepository implements HealthRepository {
  private readonly client: HealthConnectClient;

  constructor(options: ConstructorParameters<typeof HealthConnectClient>[0]) {
    this.client = new HealthConnectClient(options);
  }

  async getHealthData(): Promise<RawHealthData> {
    const [sleep, steps, activeCalories, totalCalories, heartRate, weights] =
      await Promise.all([
        this.client.fetchRecords("sleepSession", parserFor(sleepSessionSchema)),
        this.client.fetchRecords("steps", parserFor(stepsSchema)),
        this.client.fetchRecords(
          "activeCaloriesBurned",
          parserFor(energySchema),
        ),
        this.client.fetchRecords(
          "totalCaloriesBurned",
          parserFor(energySchema),
        ),
        this.client.fetchRecords(
          "restingHeartRate",
          parserFor(restingHeartRateSchema),
        ),
        this.client.fetchRecords("weight", parserFor(weightSchema)),
      ]);

    return {
      sleepSessions: sleep.map(mapSleepSession),
      steps: steps.map(mapSteps),
      activeCalories: activeCalories.map(mapEnergy),
      totalCalories: totalCalories.map(mapEnergy),
      restingHeartRates: heartRate.map(mapRestingHeartRate),
      weights: weights.map(mapWeight),
    };
  }
}

function parserFor<S extends z.ZodTypeAny>(schema: S) {
  const recordsSchema = z.array(schema);
  return (payload: unknown): Array<z.output<S>> => recordsSchema.parse(payload);
}

export function mapSleepSession(
  dto: z.infer<typeof sleepSessionSchema>,
): SleepSession {
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

function mapSteps(dto: z.infer<typeof stepsSchema>): StepsObservation {
  return {
    id: dto.id,
    source: dto.app,
    startAt: dto.start,
    endAt: dto.end,
    count: dto.data.count,
  };
}

function mapEnergy(dto: z.infer<typeof energySchema>): EnergyObservation {
  return {
    id: dto.id,
    source: dto.app,
    startAt: dto.start,
    endAt: dto.end,
    energyKcal: dto.data.energy.inKilocalories,
  };
}

function mapRestingHeartRate(
  dto: z.infer<typeof restingHeartRateSchema>,
): RestingHeartRateObservation {
  return {
    id: dto.id,
    source: dto.app,
    observedAt: dto.start,
    bpm: dto.data.beatsPerMinute,
  };
}

function mapWeight(dto: z.infer<typeof weightSchema>): WeightObservation {
  return {
    id: dto.id,
    source: dto.app,
    observedAt: dto.start,
    kilograms: dto.data.weight.inKilograms,
  };
}
