/**
 * Registry de Migrations
 * 
 * Centraliza o registro de todas as migrations
 */

import type { Migration } from './migration-manager';
import * as migration001 from './migrations/001-initial-schema';
import * as migration004 from './migrations/004-add-practice-fields';
import * as migration005 from './migrations/005-member-repertoire-and-practice-logs';

export const migrations: Migration[] = [
  {
    id: 1,
    name: '001-initial-schema',
    up: migration001.up,
    down: migration001.down,
  },
  {
    id: 2,
    name: '004-add-practice-fields',
    up: migration004.up,
    down: migration004.down,
  },
  {
    id: 3,
    name: '005-add-member-repertoire-fields',
    up: migration005.up,
    down: migration005.down,
  }
];
