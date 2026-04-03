import { useEmployeeStore } from './employeeStore'
import { createEmployee } from '../types/factories'

describe('Employee Store', () => {
  beforeEach(() => {
    useEmployeeStore.getState().reset()
  })

  it('starts with an empty employee list', () => {
    const { employees } = useEmployeeStore.getState()
    expect(employees).toEqual([])
  })

  it('adds an employee', () => {
    const { addEmployee } = useEmployeeStore.getState()
    const employee = createEmployee({ name: 'Alice', role: 'Cashier' })

    addEmployee(employee)

    const { employees } = useEmployeeStore.getState()
    expect(employees).toHaveLength(1)
    expect(employees[0].name).toBe('Alice')
  })

  it('adds multiple employees', () => {
    const { addEmployee } = useEmployeeStore.getState()

    addEmployee(createEmployee({ name: 'Alice', role: 'Cashier' }))
    addEmployee(createEmployee({ name: 'Bob', role: 'Cook' }))

    const { employees } = useEmployeeStore.getState()
    expect(employees).toHaveLength(2)
  })

  it('updates an employee by id', () => {
    const { addEmployee, updateEmployee } = useEmployeeStore.getState()
    const employee = createEmployee({ name: 'Alice', role: 'Cashier' })

    addEmployee(employee)
    updateEmployee(employee.id, { name: 'Alice Smith', maxHoursPerWeek: 30 })

    const { employees } = useEmployeeStore.getState()
    expect(employees[0].name).toBe('Alice Smith')
    expect(employees[0].maxHoursPerWeek).toBe(30)
  })

  it('updates updatedAt timestamp when modifying', () => {
    vi.useFakeTimers()
    const { addEmployee, updateEmployee } = useEmployeeStore.getState()
    const employee = createEmployee({ name: 'Alice', role: 'Cashier' })

    addEmployee(employee)
    const originalUpdatedAt = useEmployeeStore.getState().employees[0].updatedAt

    vi.advanceTimersByTime(1000)
    updateEmployee(employee.id, { name: 'Alice Smith' })

    const { employees } = useEmployeeStore.getState()
    expect(employees[0].updatedAt).not.toBe(originalUpdatedAt)
    vi.useRealTimers()
  })

  it('removes an employee by id', () => {
    const { addEmployee, removeEmployee } = useEmployeeStore.getState()
    const alice = createEmployee({ name: 'Alice', role: 'Cashier' })
    const bob = createEmployee({ name: 'Bob', role: 'Cook' })

    addEmployee(alice)
    addEmployee(bob)
    removeEmployee(alice.id)

    const { employees } = useEmployeeStore.getState()
    expect(employees).toHaveLength(1)
    expect(employees[0].name).toBe('Bob')
  })

  it('finds an employee by id', () => {
    const { addEmployee, getEmployeeById } = useEmployeeStore.getState()
    const alice = createEmployee({ name: 'Alice', role: 'Cashier' })

    addEmployee(alice)

    const found = getEmployeeById(alice.id)
    expect(found?.name).toBe('Alice')
  })

  it('returns undefined for unknown id', () => {
    const { getEmployeeById } = useEmployeeStore.getState()
    expect(getEmployeeById('nonexistent')).toBeUndefined()
  })

  it('resets to empty state', () => {
    const { addEmployee, reset } = useEmployeeStore.getState()

    addEmployee(createEmployee({ name: 'Alice', role: 'Cashier' }))
    reset()

    const { employees } = useEmployeeStore.getState()
    expect(employees).toEqual([])
  })
})
