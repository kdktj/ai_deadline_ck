import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { CheckSquare, Clock, AlertTriangle, Filter, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import DeleteTaskModal from '../components/tasks/DeleteTaskModal';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const response = await apiService.getTasks(params);
      setTasks(response.data.tasks || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách tasks. Vui lòng thử lại.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (taskId, newProgress) => {
    try {
      await apiService.updateTaskProgress(taskId, newProgress);
      await fetchTasks(); // Refresh list
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Không thể cập nhật tiến độ');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Khẩn cấp',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'Chưa bắt đầu',
      in_progress: 'Đang thực hiện',
      done: 'Hoàn thành',
      blocked: 'Bị chặn',
    };
    return labels[status] || status;
  };

  // Group tasks by status for Kanban view
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tasks</h1>
          <p className="text-gray-600 mt-1">Theo dõi tiến độ công việc</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
        >
          <PlusCircle size={18} className="mr-2" />
          Tạo task mới
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="todo">Chưa bắt đầu</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="done">Hoàn thành</option>
          <option value="blocked">Bị chặn</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả độ ưu tiên</option>
          <option value="low">Thấp</option>
          <option value="medium">Trung bình</option>
          <option value="high">Cao</option>
          <option value="critical">Khẩn cấp</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Todo Column */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Chưa bắt đầu</h3>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
              {todoTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdateProgress={updateProgress}
                onEdit={(task) => {
                  setSelectedTask(task);
                  setShowEditModal(true);
                }}
                onDelete={(task) => {
                  setSelectedTask(task);
                  setShowDeleteModal(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Đang thực hiện</h3>
            <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-sm">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdateProgress={updateProgress}
                onEdit={(task) => {
                  setSelectedTask(task);
                  setShowEditModal(true);
                }}
                onDelete={(task) => {
                  setSelectedTask(task);
                  setShowDeleteModal(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Hoàn thành</h3>
            <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-sm">
              {doneTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdateProgress={updateProgress}
                onEdit={(task) => {
                  setSelectedTask(task);
                  setShowEditModal(true);
                }}
                onDelete={(task) => {
                  setSelectedTask(task);
                  setShowDeleteModal(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có task nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tạo task mới từ trang quản lý dự án.
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTasks}
      />

      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={fetchTasks}
      />

      <DeleteTaskModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={fetchTasks}
      />
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onUpdateProgress, onEdit, onDelete }) {
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Thấp',
      medium: 'TB',
      high: 'Cao',
      critical: 'Khẩn',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow group relative">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors shadow-sm"
          title="Chỉnh sửa"
        >
          <Edit size={14} className="text-blue-600" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1.5 bg-white border border-gray-300 rounded hover:bg-red-50 hover:border-red-500 transition-colors shadow-sm"
          title="Xóa"
        >
          <Trash2 size={14} className="text-red-600" />
        </button>
      </div>

      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1 pr-12">{task.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      {task.deadline && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Clock size={12} className="mr-1" />
          {new Date(task.deadline).toLocaleDateString('vi-VN')}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">Tiến độ</span>
          <span className="font-medium text-blue-600">{task.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Quick Progress Update */}
      <div className="flex gap-1 mt-2">
        {[0, 25, 50, 75, 100].map((progress) => (
          <button
            key={progress}
            onClick={() => onUpdateProgress(task.id, progress)}
            className={`flex-1 text-xs py-1 rounded ${
              task.progress === progress
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {progress}%
          </button>
        ))}
      </div>
    </div>
  );
}
