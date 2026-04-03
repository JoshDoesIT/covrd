import Dexie, { type EntityTable } from 'dexie'
import type { Employee, CoverageRequirement, Schedule, RecurringTemplate } from '../types/index'

/**
 * CovrdDatabase — Dexie.js IndexedDB database for persistent storage.
 *
 * All user data is stored locally in the browser via IndexedDB.
 * No data ever leaves the device. This aligns with Covrd's
 * privacy-first, client-side-only architecture.
 *
 * @version 1 — Initial schema with four core tables.
 */
class CovrdDatabase extends Dexie {
  employees!: EntityTable<Employee, 'id'>
  coverageRequirements!: EntityTable<CoverageRequirement, 'id'>
  schedules!: EntityTable<Schedule, 'id'>
  templates!: EntityTable<RecurringTemplate, 'id'>

  constructor() {
    super('covrd-db')

    this.version(1).stores({
      employees: 'id, name, role, employmentType',
      coverageRequirements: 'id, day, name',
      schedules: 'id, name, startDate',
      templates: 'id, name',
    })
  }

  /**
   * Purge all data from every table.
   * Used by the Data Purge feature (Story 7.8).
   */
  async purgeAll(): Promise<void> {
    await this.transaction('rw', [this.employees, this.coverageRequirements, this.schedules, this.templates], async () => {
      await this.employees.clear()
      await this.coverageRequirements.clear()
      await this.schedules.clear()
      await this.templates.clear()
    })
  }
}

/** Singleton database instance. */
export const covrdDb = new CovrdDatabase()
