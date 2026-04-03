import { create } from 'zustand'
import type { Employee } from '../types/index'
import { covrdDb } from '../db/db'

/**
 * Employee store state and actions.
 */
interface EmployeeState {
  employees: Employee[]
  hydrate: (employees: Employee[]) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  removeEmployee: (id: string) => void
  getEmployeeById: (id: string) => Employee | undefined
  reset: () => void
}

/**
 * Zustand store for employee management.
 * Handles CRUD operations for the employee roster.
 */
export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],

  hydrate: (employees) => {
    set({ employees })
  },

  addEmployee: (employee) => {
    covrdDb.employees.put(employee).catch(console.error)
    set((state) => ({
      employees: [...state.employees, employee],
    }))
  },

  updateEmployee: (id, updates) => {
    set((state) => {
      const employees = state.employees.map((emp) => {
        if (emp.id === id) {
          const updated = { ...emp, ...updates, updatedAt: new Date().toISOString() }
          covrdDb.employees.put(updated).catch(console.error)
          return updated
        }
        return emp
      })
      return { employees }
    })
  },

  removeEmployee: (id) => {
    covrdDb.employees.delete(id).catch(console.error)
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    }))
  },

  getEmployeeById: (id) => {
    return get().employees.find((emp) => emp.id === id)
  },

  reset: () => {
    set({ employees: [] })
  },
}))
