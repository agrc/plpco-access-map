import { ImmutableObject } from 'jimu-core';

export interface Config{
  videoReportTableUrl: 'string',
  videoPointsUrl: 'string'
}

export type IMConfig = ImmutableObject<Config>;
