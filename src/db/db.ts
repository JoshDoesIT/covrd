import Dexie, { type EntityTable } from 'dexie'
import type { Employee, CoverageRequirement, BaselineRequirement, Schedule } from '../types/index'

/**
 * CovrdDatabase — Dexie.js IndexedDB database for persistent storage.
 *
 * All user data is stored locally in the browser via IndexedDB.
 * No data ever leaves the device. This aligns with covrd's
 * privacy-first, client-side-only architecture.
 *
 * @version 1 — Initial schema with four core tables.
 */
class CovrdDatabase extends Dexie {
  employees!: EntityTable<Employee, 'id'>
  coverageRequirements!: EntityTable<CoverageRequirement, 'id'>
  baselineRequirements!: EntityTable<BaselineRequirement, 'id'>
  schedules!: EntityTable<Schedule, 'id'>

  constructor() {
    super('covrd-db')

    this.version(1).stores({
      employees: 'id, name, role, employmentType',
      coverageRequirements: 'id, date',
      baselineRequirements: 'id, dayOfWeek',
      schedules: 'id, name, startDate',
    })
  }

  /**
   * Purge all data from every table.
   * Used by the Data Purge feature (Story 7.8).
   */
  async purgeAll(): Promise<void> {
    await this.transaction(
      'rw',
      [this.employees, this.coverageRequirements, this.baselineRequirements, this.schedules],
      async () => {
        await this.employees.clear()
        await this.coverageRequirements.clear()
        await this.baselineRequirements.clear()
        await this.schedules.clear()
      },
    )
  }
}

/** Singleton database instance. */
export const covrdDb = new CovrdDatabase()
