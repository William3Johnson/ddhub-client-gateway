export enum CronJobType {
  DID_LISTENER = 'DID_LISTENER',
  CHANNEL_ROLES = 'CHANNEL_ROLES',
  TOPIC_REFRESH = 'TOPIC_REFRESH',
  SYMMETRIC_KEYS = 'SYMMETRIC_KEYS',
  PRIVATE_KEY = 'PRIVATE_KEY',
  APPLICATIONS_REFRESH = 'APPLICATIONS_REFRESH',
}

export enum CronStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
