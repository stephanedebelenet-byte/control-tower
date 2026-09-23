'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore, type MaintenanceTask } from '@/stores/maintenance'
import axios from 'axios'

export default function MaintenancePage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { tasks, setTasks, setLoading, getOverdueTasks, getUpcomingTasks } =
    useMaintenanceStore()
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchMaintenanceTasks()
  }, [token, router, statusFilter])

  async function fetchMaintenanceTasks() {
    try {
      setLoading(true)
      const url =
        statusFilter === 'all'
          ? '/api/maintenance'
          : `/api/maintenance?status=${statusFilter}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setTasks(response.data)
    } catch (error) {
      console.error('Failed to fetch maintenance tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const overdueTasks = getOverdueTasks()
  const upcomingTasks = getUpcomingTasks()

  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks.filter((t) => t.status === statusFilter)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Maintenance Management (GMAO)
          </h1>
          <p className="text-slate-400">Schedule and track vehicle maintenance tasks</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
            <p className="text-red-300 text-sm mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-400">{overdueTasks.length}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4">
            <p className="text-yellow-300 text-sm mb-1">Upcoming (7 days)</p>
            <p className="text-2xl font-bold text-yellow-400">{upcomingTasks.length}</p>
          </div>
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
            <p className="text-cyan-300 text-sm mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-cyan-400">{tasks.length}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition">
            Schedule Maintenance
          </button>

          <div className="flex gap-2">
            {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">
                {filteredTasks.length} Tasks
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No maintenance tasks
                  </p>
                ) : (
                  filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedTask?.id === task.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-cyan-300">
                            {task.taskType}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {task.vehicle?.plateNumber || 'Unknown Vehicle'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            task.status === 'overdue'
                              ? 'bg-red-500/10 text-red-300 border-red-500/30'
                              : task.status === 'in_progress'
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                : 'bg-green-500/10 text-green-300 border-green-500/30'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Scheduled: {new Date(task.scheduledDate).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div>
            {selectedTask ? (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4 sticky top-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                  Task Details
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="text-white font-medium">{selectedTask.taskType}</p>
                  </div>

                  <div>
                    <p className="text-slate-500">Vehicle</p>
                    <p className="text-white font-medium">
                      {selectedTask.vehicle?.plateNumber || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="text-white font-medium capitalize">
                      {selectedTask.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Scheduled Date</p>
                    <p className="text-white font-medium">
                      {new Date(selectedTask.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Estimated Cost</p>
                    <p className="text-white font-medium">
                      ${selectedTask.estimatedCost.toFixed(2)}
                    </p>
                  </div>

                  {selectedTask.description && (
                    <div>
                      <p className="text-slate-500">Description</p>
                      <p className="text-white text-xs">{selectedTask.description}</p>
                    </div>
                  )}

                  {selectedTask.spareParts && selectedTask.spareParts.length > 0 && (
                    <div className="border-t border-slate-700 pt-3">
                      <p className="text-slate-500 mb-2">Spare Parts</p>
                      <div className="space-y-1">
                        {selectedTask.spareParts.map((part) => (
                          <p key={part.id} className="text-xs text-slate-400">
                            {part.partName} x{part.quantity} @${part.unitPrice}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button className="w-full mt-4 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition">
                  Update Status
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-slate-500 text-center">
                Select a task to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
