import * as migration_20260824_191516_initial_foundation from './20260824_191516_initial_foundation';

export const migrations = [
  {
    up: migration_20260824_191516_initial_foundation.up,
    down: migration_20260824_191516_initial_foundation.down,
    name: '20260824_191516_initial_foundation'
  },
];
