import { create } from 'zustand'
import type { Employee } from '../types/index'

/**
 * Employee store state and actions.
 */
interface EmployeeState {
  employees: Employee[]
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

  addEmployee: (employee) => {
    set((state) => ({
      employees: [...state.employees, employee],
    }))
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp,
      ),
    }))
  },

  removeEmployee: (id) => {
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
