
import { OFFICIAL_SOURCES } from '../constants';

export const officialDataSources = OFFICIAL_SOURCES;

export const citeSource = (sourceId: string) => {
  const source = OFFICIAL_SOURCES.find(s => s.id === sourceId);
  return source ? source.name : sourceId;
};
