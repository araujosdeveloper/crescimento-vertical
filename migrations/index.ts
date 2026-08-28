import * as migration_20260824_191516_initial_foundation from './20260824_191516_initial_foundation';
import * as migration_20260825_013756_add_article_featured from './20260825_013756_add_article_featured';
import * as migration_20260828_153822_add_services_cases from './20260828_153822_add_services_cases';

export const migrations = [
  {
    up: migration_20260824_191516_initial_foundation.up,
    down: migration_20260824_191516_initial_foundation.down,
    name: '20260824_191516_initial_foundation',
  },
  {
    up: migration_20260825_013756_add_article_featured.up,
    down: migration_20260825_013756_add_article_featured.down,
    name: '20260825_013756_add_article_featured',
  },
  {
    up: migration_20260828_153822_add_services_cases.up,
    down: migration_20260828_153822_add_services_cases.down,
    name: '20260828_153822_add_services_cases'
  },
];
