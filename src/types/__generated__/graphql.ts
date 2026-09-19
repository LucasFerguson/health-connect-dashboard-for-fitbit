/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
};

export type Analytics = {
  __typename: 'Analytics';
  activeCalories: MetricSeries;
  algorithmVersion: Scalars['String']['output'];
  day: Maybe<Day>;
  days: Array<Day>;
  deviceSleepComparisons: Array<DeviceSleepComparison>;
  healthspan: HealthspanSummary;
  heartRateVariability: MetricSeries;
  processedAt: Maybe<Scalars['DateTime']['output']>;
  recovery: RecoverySummary;
  restingHeartRate: MetricSeries;
  runId: Scalars['ID']['output'];
  sleepConsistency: SleepConsistencySummary;
  sleepDebt: SleepDebtSummary;
  sleepEvents: Array<SleepEvent>;
  steps: MetricSeries;
  strain: StrainSummary;
  timeZone: Scalars['String']['output'];
  totalCalories: MetricSeries;
  weight: MetricSeries;
};


export type AnalyticsDayArgs = {
  date: Scalars['Date']['input'];
  radius?: InputMaybe<Scalars['Int']['input']>;
};


export type AnalyticsDaysArgs = {
  range?: InputMaybe<TimeRange>;
};


export type AnalyticsSleepEventsArgs = {
  range?: InputMaybe<TimeRange>;
};

export type AnalyticsConfig = {
  __typename: 'AnalyticsConfig';
  birthDate: Maybe<Scalars['Date']['output']>;
  heartRateZoneTestDate: Maybe<Scalars['Date']['output']>;
  heartRateZoneThresholds: Maybe<Array<Scalars['Float']['output']>>;
  homeTimeZone: Scalars['String']['output'];
  sleepTargetMinutes: Scalars['Int']['output'];
};

export type AnalyticsJobStatus = {
  __typename: 'AnalyticsJobStatus';
  completedAt: Maybe<Scalars['DateTime']['output']>;
  error: Maybe<Scalars['JSON']['output']>;
  reason: Maybe<Scalars['String']['output']>;
  requestedAt: Maybe<Scalars['DateTime']['output']>;
  requestedRevision: Maybe<Scalars['Int']['output']>;
  result: Maybe<Scalars['JSON']['output']>;
  startedAt: Maybe<Scalars['DateTime']['output']>;
  status: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type Availability = {
  __typename: 'Availability';
  available: Scalars['Boolean']['output'];
  reasons: Array<Scalars['String']['output']>;
};

export enum ConsistencyCategory {
  Optimal = 'OPTIMAL',
  Poor = 'POOR',
  Sufficient = 'SUFFICIENT'
}

export type CurrentRun = {
  __typename: 'CurrentRun';
  algorithmVersion: Scalars['String']['output'];
  completedAt: Scalars['DateTime']['output'];
  configurationFingerprint: Scalars['String']['output'];
  counts: Scalars['JSON']['output'];
  issueCount: Scalars['Int']['output'];
  runId: Scalars['ID']['output'];
  sourceFingerprint: Scalars['String']['output'];
};

export type Day = {
  __typename: 'Day';
  contractVersion: Scalars['String']['output'];
  date: Scalars['Date']['output'];
  dayState: DayState;
  generatedAt: Maybe<Scalars['DateTime']['output']>;
  headlineScores: HeadlineScores;
  heartRateZones: MetricValue;
  notes: Array<DayNote>;
  supportingMetrics: SupportingMetrics;
  timeZone: Scalars['String']['output'];
  timeline: DayTimeline;
};

export type DayNote = {
  __typename: 'DayNote';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export enum DayState {
  Future = 'FUTURE',
  Recorded = 'RECORDED'
}

export type DayTimeline = {
  __typename: 'DayTimeline';
  heartRate: HeartRateTimeline;
  now: NowMarker;
  schedule: MetricValue;
  sleepStages: Array<SleepStage>;
  steps: Array<HourlyStepBucket>;
  strain: Array<StrainTimelinePoint>;
  targetBedTime: MetricValue;
  targetWakeTime: MetricValue;
  workouts: Array<WorkoutSummary>;
};

export enum DebtCategory {
  High = 'HIGH',
  Low = 'LOW',
  Moderate = 'MODERATE',
  None = 'NONE'
}

export type DeviceAssociation = {
  __typename: 'DeviceAssociation';
  deviceMetadata: Scalars['Boolean']['output'];
  legacyWithoutDeviceMetadata: Scalars['Boolean']['output'];
  sourcePackage: Scalars['Boolean']['output'];
};

export type DeviceCatalog = {
  __typename: 'DeviceCatalog';
  count: Scalars['Int']['output'];
  devices: Array<ObservedDevice>;
  limitations: Array<Scalars['String']['output']>;
};

export type DeviceIdentity = {
  __typename: 'DeviceIdentity';
  manufacturer: Maybe<Scalars['String']['output']>;
  model: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['Int']['output']>;
  typeLabel: Maybe<Scalars['String']['output']>;
};

export type DeviceSleepComparison = {
  __typename: 'DeviceSleepComparison';
  averageDifferenceMinutes: Scalars['Float']['output'];
  averageSleepMinutes: Scalars['Float']['output'];
  comparisonCount: Scalars['Int']['output'];
  recordingCount: Scalars['Int']['output'];
  source: Scalars['String']['output'];
};

export type EnergyRecord = {
  __typename: 'EnergyRecord';
  endAt: Scalars['DateTime']['output'];
  energyKcal: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  source: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
};

export type ExerciseSession = {
  __typename: 'ExerciseSession';
  endAt: Scalars['DateTime']['output'];
  exerciseType: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  notes: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  sourceZoneOffsets: Maybe<ZoneOffsets>;
  startAt: Scalars['DateTime']['output'];
  title: Maybe<Scalars['String']['output']>;
};

export type HeadlineScores = {
  __typename: 'HeadlineScores';
  recovery: RecoveryMetric;
  sleepDuration: SleepDurationMetric;
  sleepNeed: MetricValue;
  strain: StrainMetric;
  strainTarget: MetricValue;
};

export type HealthspanDay = {
  __typename: 'HealthspanDay';
  ageDeltaYears: Maybe<Scalars['Float']['output']>;
  chronologicalAgeYears: Maybe<Scalars['Float']['output']>;
  date: Scalars['Date']['output'];
  factors: Array<HealthspanFactor>;
  healthAgeYears: Maybe<Scalars['Float']['output']>;
  paceOfAging: Maybe<Scalars['Float']['output']>;
  qualityFlags: Array<Scalars['String']['output']>;
};

export type HealthspanFactor = {
  __typename: 'HealthspanFactor';
  ageImpactYears: Maybe<Scalars['Float']['output']>;
  coverageDays: Maybe<Scalars['Int']['output']>;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  referenceValue: Maybe<Scalars['Float']['output']>;
  unit: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type HealthspanSummary = {
  __typename: 'HealthspanSummary';
  birthDateConfigured: Scalars['Boolean']['output'];
  calibrationReasons: Array<Scalars['String']['output']>;
  latest: Maybe<HealthspanDay>;
  methodology: Scalars['String']['output'];
  modelVersion: Scalars['String']['output'];
  paceOfAging: Maybe<Scalars['Float']['output']>;
  paceWindowDays: Maybe<Scalars['Int']['output']>;
  status: Scalars['String']['output'];
  trend: Array<HealthspanDay>;
};


export type HealthspanSummaryTrendArgs = {
  range?: InputMaybe<TimeRange>;
};

export type HeartRateData = {
  __typename: 'HeartRateData';
  records: Array<HeartRateRecord>;
  sampleCount: Scalars['Int']['output'];
  samples: Array<HeartRateSample>;
  source: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
};


export type HeartRateDataRecordsArgs = {
  range?: InputMaybe<TimeRange>;
};


export type HeartRateDataSamplesArgs = {
  range?: InputMaybe<TimeRange>;
};

export type HeartRateRecord = {
  __typename: 'HeartRateRecord';
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  samples: Array<HeartRateSample>;
  source: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
};

export type HeartRateSample = {
  __typename: 'HeartRateSample';
  bpm: Scalars['Float']['output'];
  observedAt: Scalars['DateTime']['output'];
};

export type HeartRateTimeline = {
  __typename: 'HeartRateTimeline';
  hours: Array<HourlyHeartRate>;
  note: Maybe<Scalars['String']['output']>;
  observedMinuteCount: Scalars['Int']['output'];
  sampleCount: Scalars['Int']['output'];
  source: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
};

export type HeartRateVariabilityRecord = {
  __typename: 'HeartRateVariabilityRecord';
  id: Scalars['ID']['output'];
  milliseconds: Scalars['Float']['output'];
  observedAt: Scalars['DateTime']['output'];
  source: Scalars['String']['output'];
};

export type HourlyHeartRate = {
  __typename: 'HourlyHeartRate';
  hour: Scalars['Int']['output'];
  max: Maybe<Scalars['Float']['output']>;
  mean: Maybe<Scalars['Float']['output']>;
  min: Maybe<Scalars['Float']['output']>;
  p25: Maybe<Scalars['Float']['output']>;
  p75: Maybe<Scalars['Float']['output']>;
  sampleCount: Scalars['Int']['output'];
  status: MetricStatus;
};

export type HourlyStepBucket = {
  __typename: 'HourlyStepBucket';
  count: Scalars['Int']['output'];
  hour: Scalars['Int']['output'];
  status: MetricStatus;
};

export enum IdentityQuality {
  DeviceType = 'DEVICE_TYPE',
  ExplicitModel = 'EXPLICIT_MODEL',
  SourceOnly = 'SOURCE_ONLY'
}

export type IngestionStatus = {
  __typename: 'IngestionStatus';
  analyticsJob: Maybe<AnalyticsJobStatus>;
  current: Maybe<CurrentRun>;
  phoneSync: PhoneSyncStatus;
};

export type MetricDay = {
  __typename: 'MetricDay';
  bySource: Array<SourceContribution>;
  date: Scalars['Date']['output'];
  qualityFlags: Array<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  value: Scalars['Float']['output'];
};

export type MetricOverview = {
  __typename: 'MetricOverview';
  average7Day: Maybe<Scalars['Float']['output']>;
  average30Day: Maybe<Scalars['Float']['output']>;
  changeFromPrevious: Maybe<Scalars['Float']['output']>;
  latest: Maybe<MetricDay>;
  previous: Maybe<MetricDay>;
  sampleCount: Scalars['Int']['output'];
};

export type MetricSeries = {
  __typename: 'MetricSeries';
  daily: Array<MetricDay>;
  monthly: Array<MonthlyPoint>;
  overview: MetricOverview;
  rolling7Day: Array<RollingPoint>;
  unit: Scalars['String']['output'];
};


export type MetricSeriesDailyArgs = {
  range?: InputMaybe<TimeRange>;
};


export type MetricSeriesRolling7DayArgs = {
  range?: InputMaybe<TimeRange>;
};

export enum MetricStatus {
  Available = 'AVAILABLE',
  Blocked = 'BLOCKED',
  InsufficientData = 'INSUFFICIENT_DATA',
  Missing = 'MISSING',
  NotImplemented = 'NOT_IMPLEMENTED',
  Partial = 'PARTIAL',
  SampleTimeOnly = 'SAMPLE_TIME_ONLY',
  Unavailable = 'UNAVAILABLE'
}

export type MetricValue = {
  __typename: 'MetricValue';
  note: Maybe<Scalars['String']['output']>;
  qualityFlags: Array<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
  unit: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['Float']['output']>;
};

export type MonthlyPoint = {
  __typename: 'MonthlyPoint';
  month: Scalars['String']['output'];
  sampleCount: Scalars['Int']['output'];
  value: Scalars['Float']['output'];
};

export type NowMarker = {
  __typename: 'NowMarker';
  latestObservedAt: Maybe<Scalars['DateTime']['output']>;
  note: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
};

export type ObservedDevice = {
  __typename: 'ObservedDevice';
  association: DeviceAssociation;
  description: Scalars['String']['output'];
  device: Maybe<DeviceIdentity>;
  earliest: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  identityQuality: IdentityQuality;
  latest: Maybe<Scalars['DateTime']['output']>;
  mayCombinePhysicalDevices: Scalars['Boolean']['output'];
  recordingMethods: Array<RecordingMethodCount>;
  records: Scalars['Int']['output'];
  signals: Array<SignalCount>;
  sourceLabel: Scalars['String']['output'];
  sourcePackage: Scalars['String']['output'];
};

export type OxygenSaturationRecord = {
  __typename: 'OxygenSaturationRecord';
  id: Scalars['ID']['output'];
  observedAt: Scalars['DateTime']['output'];
  percentage: Scalars['Float']['output'];
  source: Scalars['String']['output'];
};

export type PhoneSyncStatus = {
  __typename: 'PhoneSyncStatus';
  activeUntil: Maybe<Scalars['DateTime']['output']>;
  activityWindowSeconds: Scalars['Int']['output'];
  lastRecordCount: Maybe<Scalars['Int']['output']>;
  lastRecordType: Maybe<Scalars['String']['output']>;
  lastUploadAt: Maybe<Scalars['DateTime']['output']>;
  note: Scalars['String']['output'];
  observedActive: Scalars['Boolean']['output'];
  secondsSinceLastUpload: Maybe<Scalars['Int']['output']>;
  state: SyncState;
  totalRecordsReceived: Scalars['Int']['output'];
  totalUploadRequests: Scalars['Int']['output'];
};

export type PrimarySelection = {
  __typename: 'PrimarySelection';
  eligibleRecordingCount: Scalars['Int']['output'];
  longestWindowMinutes: Scalars['Float']['output'];
  method: Scalars['String']['output'];
  minimumWindowRatio: Scalars['Float']['output'];
  selectedHasCredibleDetailedStages: Scalars['Boolean']['output'];
  selectedStageDataStatus: Scalars['String']['output'];
  selectedWindowMinutes: Scalars['Float']['output'];
  version: Scalars['String']['output'];
};

export type Query = {
  __typename: 'Query';
  viewer: Viewer;
};

export enum RangeMatch {
  Overlaps = 'OVERLAPS',
  StartsWithin = 'STARTS_WITHIN'
}

export type RecordingMethodCount = {
  __typename: 'RecordingMethodCount';
  label: Scalars['String']['output'];
  records: Scalars['Int']['output'];
  value: Maybe<Scalars['Int']['output']>;
};

export type RecoveryAvailability = {
  __typename: 'RecoveryAvailability';
  available: Scalars['Boolean']['output'];
  completeDayCount: Scalars['Int']['output'];
  publishableDayCount: Scalars['Int']['output'];
  reasons: Array<Scalars['String']['output']>;
};

export enum RecoveryBand {
  High = 'HIGH',
  Low = 'LOW',
  Moderate = 'MODERATE'
}

export type RecoveryComponent = {
  __typename: 'RecoveryComponent';
  baseline: Maybe<Scalars['Float']['output']>;
  baselineDays: Maybe<Scalars['Int']['output']>;
  score: Scalars['Float']['output'];
  unit: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type RecoveryComponents = {
  __typename: 'RecoveryComponents';
  hrv: Maybe<RecoveryComponent>;
  restingHeartRate: Maybe<RecoveryComponent>;
  sleep: Maybe<RecoveryComponent>;
  sleepConsistency: Maybe<RecoveryComponent>;
};

export type RecoveryDay = {
  __typename: 'RecoveryDay';
  band: Maybe<RecoveryBand>;
  components: RecoveryComponents;
  date: Scalars['Date']['output'];
  provisional: Scalars['Boolean']['output'];
  quality: RecoveryDayQuality;
  score: Maybe<Scalars['Int']['output']>;
  status: Scalars['String']['output'];
};

export type RecoveryDayQuality = {
  __typename: 'RecoveryDayQuality';
  availableWeight: Scalars['Float']['output'];
  baselineWindowDays: Scalars['Int']['output'];
  complete: Scalars['Boolean']['output'];
  minimumBaselineDays: Scalars['Int']['output'];
  publishable: Scalars['Boolean']['output'];
  reasons: Array<Scalars['String']['output']>;
};

export type RecoveryMetric = {
  __typename: 'RecoveryMetric';
  band: Maybe<RecoveryBand>;
  components: Maybe<RecoveryComponents>;
  modelVersion: Maybe<Scalars['String']['output']>;
  note: Maybe<Scalars['String']['output']>;
  provisional: Maybe<Scalars['Boolean']['output']>;
  quality: Maybe<RecoveryQuality>;
  qualityFlags: Array<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
  unit: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['Float']['output']>;
};

export type RecoveryQuality = {
  __typename: 'RecoveryQuality';
  complete: Maybe<Scalars['Boolean']['output']>;
  publishable: Maybe<Scalars['Boolean']['output']>;
  reasons: Maybe<Array<Scalars['String']['output']>>;
};

export type RecoverySummary = {
  __typename: 'RecoverySummary';
  algorithmVersion: Scalars['String']['output'];
  availability: RecoveryAvailability;
  daily: Array<RecoveryDay>;
  limitations: Array<Scalars['String']['output']>;
  methodology: Scalars['String']['output'];
  provisional: Scalars['Boolean']['output'];
  status: Scalars['String']['output'];
  weights: RecoveryWeights;
};


export type RecoverySummaryDailyArgs = {
  range?: InputMaybe<TimeRange>;
};

export type RecoveryWeights = {
  __typename: 'RecoveryWeights';
  hrv: Scalars['Float']['output'];
  restingHeartRate: Scalars['Float']['output'];
  sleep: Scalars['Float']['output'];
  sleepConsistency: Scalars['Float']['output'];
};

export type RespiratoryRateRecord = {
  __typename: 'RespiratoryRateRecord';
  breathsPerMinute: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  observedAt: Scalars['DateTime']['output'];
  source: Scalars['String']['output'];
};

export type RestingHeartRateRecord = {
  __typename: 'RestingHeartRateRecord';
  bpm: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  observedAt: Scalars['DateTime']['output'];
  source: Scalars['String']['output'];
};

export type RollingPoint = {
  __typename: 'RollingPoint';
  date: Scalars['Date']['output'];
  sampleCount: Scalars['Int']['output'];
  value: Maybe<Scalars['Float']['output']>;
};

export type SignalCount = {
  __typename: 'SignalCount';
  collection: Scalars['String']['output'];
  count: Scalars['Int']['output'];
};

export type SignalInventory = {
  __typename: 'SignalInventory';
  earliest: Maybe<Scalars['DateTime']['output']>;
  latest: Maybe<Scalars['DateTime']['output']>;
  signals: Array<SignalInventoryEntry>;
  sources: Array<SourceSummary>;
  totalRecords: Scalars['Int']['output'];
};

export type SignalInventoryEntry = {
  __typename: 'SignalInventoryEntry';
  bySource: Array<SourceCount>;
  collection: Scalars['String']['output'];
  earliest: Maybe<Scalars['DateTime']['output']>;
  latest: Maybe<Scalars['DateTime']['output']>;
  records: Scalars['Int']['output'];
};

export type SleepConsistencyDay = {
  __typename: 'SleepConsistencyDay';
  baselineBedtimeMinutesLocal: Maybe<Scalars['Float']['output']>;
  baselineNightCount: Scalars['Int']['output'];
  baselineWakeMinutesLocal: Maybe<Scalars['Float']['output']>;
  bedtimeAt: Maybe<Scalars['DateTime']['output']>;
  bedtimeDeviationMinutes: Maybe<Scalars['Float']['output']>;
  bedtimeMinutesLocal: Maybe<Scalars['Float']['output']>;
  category: Maybe<ConsistencyCategory>;
  date: Scalars['Date']['output'];
  qualityFlags: Array<Scalars['String']['output']>;
  rolling7DayAverageScore: Maybe<Scalars['Float']['output']>;
  rolling30DayAverageScore: Maybe<Scalars['Float']['output']>;
  score: Maybe<Scalars['Float']['output']>;
  source: Maybe<Scalars['String']['output']>;
  wakeAt: Maybe<Scalars['DateTime']['output']>;
  wakeDeviationMinutes: Maybe<Scalars['Float']['output']>;
  wakeMinutesLocal: Maybe<Scalars['Float']['output']>;
};

export type SleepConsistencySummary = {
  __typename: 'SleepConsistencySummary';
  average7DayScore: Maybe<Scalars['Float']['output']>;
  average30DayScore: Maybe<Scalars['Float']['output']>;
  baselineWindowDays: Scalars['Int']['output'];
  breakdown30Day: Maybe<Scalars['JSON']['output']>;
  daily: Array<SleepConsistencyDay>;
  latest: Maybe<SleepConsistencyDay>;
  methodology: Scalars['String']['output'];
  minimumBaselineNights: Scalars['Int']['output'];
  previous30DayAverageScore: Maybe<Scalars['Float']['output']>;
};


export type SleepConsistencySummaryDailyArgs = {
  range?: InputMaybe<TimeRange>;
};

export type SleepDebtDay = {
  __typename: 'SleepDebtDay';
  category: DebtCategory;
  date: Scalars['Date']['output'];
  debtMinutes: Scalars['Float']['output'];
  rolling7DayAverageMinutes: Maybe<Scalars['Float']['output']>;
  rolling7DayTotalMinutes: Maybe<Scalars['Float']['output']>;
  rolling30DayAverageMinutes: Maybe<Scalars['Float']['output']>;
  sleepMinutes: Scalars['Float']['output'];
  surplusMinutes: Scalars['Float']['output'];
  targetMinutes: Scalars['Int']['output'];
};

export type SleepDebtSummary = {
  __typename: 'SleepDebtSummary';
  average7DayMinutes: Maybe<Scalars['Float']['output']>;
  average30DayMinutes: Maybe<Scalars['Float']['output']>;
  breakdown30Day: Maybe<Scalars['JSON']['output']>;
  daily: Array<SleepDebtDay>;
  latest: Maybe<SleepDebtDay>;
  methodology: Scalars['String']['output'];
  previous30DayAverageMinutes: Maybe<Scalars['Float']['output']>;
  targetMinutes: Scalars['Int']['output'];
};


export type SleepDebtSummaryDailyArgs = {
  range?: InputMaybe<TimeRange>;
};

export type SleepDurationMetric = {
  __typename: 'SleepDurationMetric';
  eventCount: Maybe<Scalars['Int']['output']>;
  events: Array<SleepEventSummary>;
  mainEvent: Maybe<SleepEventSummary>;
  note: Maybe<Scalars['String']['output']>;
  recordingCount: Maybe<Scalars['Int']['output']>;
  source: Maybe<Scalars['String']['output']>;
  stageDataStatus: Maybe<Scalars['String']['output']>;
  stageMinutes: Maybe<StageMinutes>;
  status: MetricStatus;
  unclassifiedSleepMinutes: Maybe<Scalars['Float']['output']>;
  unit: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['Float']['output']>;
  valueScope: Maybe<Scalars['String']['output']>;
  window: Maybe<TimeWindow>;
  windowScope: Maybe<Scalars['String']['output']>;
};

export type SleepEvent = {
  __typename: 'SleepEvent';
  date: Scalars['Date']['output'];
  detailedStageCoverageRatio: Scalars['Float']['output'];
  hasCredibleDetailedStages: Scalars['Boolean']['output'];
  hasCredibleStageTimeline: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  localEndAt: Scalars['DateTime']['output'];
  localStartAt: Scalars['DateTime']['output'];
  primary: SleepSession;
  primarySelection: PrimarySelection;
  qualityFlags: Array<Scalars['String']['output']>;
  recordingCount: Scalars['Int']['output'];
  recordings: Array<SleepSession>;
  role: SleepEventRole;
  sleepMinutes: Scalars['Float']['output'];
  stageCoverageMinutes: Scalars['Float']['output'];
  stageCoverageRatio: Scalars['Float']['output'];
  stageDataStatus: Scalars['String']['output'];
  stageMinutes: StageMinutes;
  timeZone: Scalars['String']['output'];
  windowMinutes: Scalars['Float']['output'];
};

export enum SleepEventRole {
  Main = 'MAIN',
  Supplemental = 'SUPPLEMENTAL'
}

export type SleepEventSummary = {
  __typename: 'SleepEventSummary';
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  qualityFlags: Maybe<Array<Scalars['String']['output']>>;
  recordingCount: Maybe<Scalars['Int']['output']>;
  role: SleepEventRole;
  sleepMinutes: Scalars['Float']['output'];
  source: Maybe<Scalars['String']['output']>;
  stageDataStatus: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
  windowMinutes: Scalars['Float']['output'];
};

export type SleepSession = {
  __typename: 'SleepSession';
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  notes: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  sourceZoneOffsets: Maybe<ZoneOffsets>;
  stages: Array<SleepStage>;
  startAt: Scalars['DateTime']['output'];
  title: Maybe<Scalars['String']['output']>;
};

export type SleepStage = {
  __typename: 'SleepStage';
  endAt: Scalars['DateTime']['output'];
  kind: SleepStageKind;
  startAt: Scalars['DateTime']['output'];
};

export enum SleepStageKind {
  Asleep = 'ASLEEP',
  Awake = 'AWAKE',
  Deep = 'DEEP',
  Light = 'LIGHT',
  Rem = 'REM',
  Unknown = 'UNKNOWN'
}

export type SourceCatalog = {
  __typename: 'SourceCatalog';
  devices: DeviceCatalog;
  inventory: SignalInventory;
};

export type SourceContribution = {
  __typename: 'SourceContribution';
  coverageMinutes: Maybe<Scalars['Float']['output']>;
  observationCount: Scalars['Int']['output'];
  source: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type SourceCount = {
  __typename: 'SourceCount';
  count: Scalars['Int']['output'];
  source: Scalars['String']['output'];
};

export type SourceRecords = {
  __typename: 'SourceRecords';
  activeCalories: Array<EnergyRecord>;
  exerciseSessions: Array<ExerciseSession>;
  heartRate: HeartRateData;
  heartRateVariability: Array<HeartRateVariabilityRecord>;
  oxygenSaturation: Array<OxygenSaturationRecord>;
  respiratoryRate: Array<RespiratoryRateRecord>;
  restingHeartRate: Array<RestingHeartRateRecord>;
  sleepSessions: Array<SleepSession>;
  steps: Array<StepRecord>;
  totalCalories: Array<EnergyRecord>;
  weight: Array<WeightRecord>;
};


export type SourceRecordsActiveCaloriesArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsExerciseSessionsArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsHeartRateArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsHeartRateVariabilityArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsOxygenSaturationArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsRespiratoryRateArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsRestingHeartRateArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsSleepSessionsArgs = {
  match?: InputMaybe<RangeMatch>;
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsStepsArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsTotalCaloriesArgs = {
  range?: InputMaybe<TimeRange>;
};


export type SourceRecordsWeightArgs = {
  range?: InputMaybe<TimeRange>;
};

export type SourceSummary = {
  __typename: 'SourceSummary';
  label: Scalars['String']['output'];
  records: Scalars['Int']['output'];
  source: Scalars['String']['output'];
};

export type StageMinutes = {
  __typename: 'StageMinutes';
  asleep: Scalars['Float']['output'];
  awake: Scalars['Float']['output'];
  deep: Scalars['Float']['output'];
  light: Scalars['Float']['output'];
  rem: Scalars['Float']['output'];
  unknown: Scalars['Float']['output'];
};

export type StepRecord = {
  __typename: 'StepRecord';
  count: Scalars['Int']['output'];
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  source: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
};

export type StrainCalibration = {
  __typename: 'StrainCalibration';
  available: Scalars['Boolean']['output'];
  confidence: Maybe<Scalars['String']['output']>;
  dateCount: Maybe<Scalars['Int']['output']>;
  empiricalHighBpm: Maybe<Scalars['Float']['output']>;
  invalidSampleCount: Maybe<Scalars['Int']['output']>;
  method: Maybe<Scalars['String']['output']>;
  reasons: Array<Scalars['String']['output']>;
  sampleCount: Maybe<Scalars['Int']['output']>;
  thresholds: Maybe<Array<Scalars['Float']['output']>>;
};

export type StrainDay = {
  __typename: 'StrainDay';
  date: Scalars['Date']['output'];
  loadMinutes: Scalars['Float']['output'];
  quality: StrainQuality;
  score: Maybe<Scalars['Float']['output']>;
  timeline: Array<StrainTimelinePoint>;
  zoneMinutes: ZoneMinutes;
};

export type StrainMetric = {
  __typename: 'StrainMetric';
  modelVersion: Maybe<Scalars['String']['output']>;
  note: Maybe<Scalars['String']['output']>;
  quality: Maybe<StrainQuality>;
  qualityFlags: Array<Scalars['String']['output']>;
  source: Maybe<Scalars['String']['output']>;
  status: MetricStatus;
  unit: Maybe<Scalars['String']['output']>;
  value: Maybe<Scalars['Float']['output']>;
};

export type StrainQuality = {
  __typename: 'StrainQuality';
  coverageRatio: Scalars['Float']['output'];
  invalidSampleCount: Scalars['Int']['output'];
  maxGapMinutes: Maybe<Scalars['Float']['output']>;
  observedMinutes: Scalars['Float']['output'];
  publishable: Scalars['Boolean']['output'];
  reasons: Array<Scalars['String']['output']>;
  spanMinutes: Scalars['Float']['output'];
};

export type StrainSummary = {
  __typename: 'StrainSummary';
  algorithmVersion: Scalars['String']['output'];
  availability: Availability;
  calibration: StrainCalibration;
  daily: Array<StrainDay>;
  limitations: Array<Scalars['String']['output']>;
  methodology: Scalars['String']['output'];
  provisional: Scalars['Boolean']['output'];
  source: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  timeZone: Scalars['String']['output'];
  workouts: Array<StrainWorkout>;
};


export type StrainSummaryDailyArgs = {
  range?: InputMaybe<TimeRange>;
};


export type StrainSummaryWorkoutsArgs = {
  range?: InputMaybe<TimeRange>;
};

export type StrainTimelinePoint = {
  __typename: 'StrainTimelinePoint';
  at: Scalars['DateTime']['output'];
  loadMinutes: Scalars['Float']['output'];
  strain: Maybe<Scalars['Float']['output']>;
};

export type StrainWorkout = {
  __typename: 'StrainWorkout';
  endAt: Scalars['DateTime']['output'];
  id: Maybe<Scalars['ID']['output']>;
  loadMinutes: Scalars['Float']['output'];
  quality: StrainQuality;
  score: Maybe<Scalars['Float']['output']>;
  startAt: Scalars['DateTime']['output'];
  timeline: Array<StrainTimelinePoint>;
  zoneMinutes: ZoneMinutes;
};

export type SupportingMetrics = {
  __typename: 'SupportingMetrics';
  calories: MetricValue;
  hrv: MetricValue;
  oxygenSaturation: MetricValue;
  respiratoryRate: MetricValue;
  restingHeartRate: MetricValue;
  skinTemperatureDeviation: MetricValue;
  steps: MetricValue;
  zone3AndAbove: MetricValue;
};

export enum SyncState {
  Idle = 'IDLE',
  NeverObserved = 'NEVER_OBSERVED',
  Receiving = 'RECEIVING'
}

export type TimeRange = {
  endExclusive: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
};

export type TimeWindow = {
  __typename: 'TimeWindow';
  endAt: Scalars['DateTime']['output'];
  startAt: Scalars['DateTime']['output'];
};

export type Viewer = {
  __typename: 'Viewer';
  analytics: Analytics;
  config: AnalyticsConfig;
  ingestion: IngestionStatus;
  sourceRecords: SourceRecords;
  sources: SourceCatalog;
};

export type WeightRecord = {
  __typename: 'WeightRecord';
  id: Scalars['ID']['output'];
  kilograms: Scalars['Float']['output'];
  observedAt: Scalars['DateTime']['output'];
  source: Scalars['String']['output'];
};

export type WorkoutSummary = {
  __typename: 'WorkoutSummary';
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  source: Maybe<Scalars['String']['output']>;
  startAt: Scalars['DateTime']['output'];
  strainContribution: Maybe<Scalars['Float']['output']>;
  strainQuality: Maybe<StrainQuality>;
  type: Scalars['Int']['output'];
  typeLabel: Scalars['String']['output'];
};

export type ZoneMinutes = {
  __typename: 'ZoneMinutes';
  belowZone1: Scalars['Float']['output'];
  zone1: Scalars['Float']['output'];
  zone2: Scalars['Float']['output'];
  zone3: Scalars['Float']['output'];
  zone4: Scalars['Float']['output'];
  zone5: Scalars['Float']['output'];
};

export type ZoneOffsets = {
  __typename: 'ZoneOffsets';
  end: Maybe<Scalars['Int']['output']>;
  start: Maybe<Scalars['Int']['output']>;
};
