import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ChevronRight, 
  Calendar, 
  Edit, 
  Trash2, 
  FolderOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import Button from '../components/common/Button';
import EditProjectModal from '../components/projects/EditProjectModal';
import DeleteProjectModal from '../components/projects/DeleteProjectModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        apiService.getProject(id),
        apiService.getTasks({ project_id: id }),
      ]);
      
      setProject(projectRes.data);
      setTasks(tasksRes.data.tasks || []);

      // Fetch forecasts if available
      try {
        const forecastsRes = await apiService.getForecasts({ project_id: id });
        setForecasts(forecastsRes.data.forecasts || []);
      } catch (err) {
        console.log('No forecasts available');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Không thể tải thông tin dự án');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuccess = () => {
    toast.success('Đã xóa dự án');
    navigate('/projects');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Đang thực hiện',
      completed: 'Hoàn thành',
      on_hold: 'Tạm dừng',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Không tìm thấy dự án</p>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-6">
        <Link to="/projects" className="hover:text-blue-600">
          Dự án
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-900 font-medium">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit size={16} className="mr-2" />
              Chỉnh sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} className="mr-2" />
              Xóa
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng số tasks</span>
              <CheckCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{tasks.length}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Hoàn thành</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">{completedTasks}</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Đang làm</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">{inProgressTasks}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-700">Tiến độ</span>
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">{progressPercentage}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Tiến độ tổng thể</span>
              <span>{completedTasks}/{tasks.length} tasks hoàn thành</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('forecasts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'forecasts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dự đoán rủi ro ({forecasts.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin dự án</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên dự án
                  </label>
                  <p className="text-gray-900">{project.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <p className="text-gray-900">
                    {project.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <div className="flex items-center text-gray-900">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {project.start_date 
                      ? new Date(project.start_date).toLocaleDateString('vi-VN')
                      : <span className="text-gray-400 italic">Chưa xác định</span>
                    }
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <div className="flex items-center text-gray-900">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {project.end_date 
                      ? new Date(project.end_date).toLocaleDateString('vi-VN')
                      : <span className="text-gray-400 italic">Chưa xác định</span>
                    }
                  </div>
                </div>

                {project.owner_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Người quản lý
                    </label>
                    <p className="text-gray-900">{project.owner_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách Tasks</h3>
              <Link to="/tasks">
                <Button size="sm">
                  Quản lý tasks
                </Button>
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Chưa có task nào trong dự án này</p>
                <Link to="/tasks" className="text-blue-600 hover:underline mt-2 inline-block">
                  Tạo task mới
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Task</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Người phụ trách</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ưu tiên</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tiến độ</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{task.name}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {task.assigned_name || <span className="text-gray-400 italic">Chưa assign</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700">{task.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 min-w-[40px]">{task.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {task.deadline 
                            ? new Date(task.deadline).toLocaleDateString('vi-VN')
                            : <span className="text-gray-400 italic">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'forecasts' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dự đoán & Cảnh báo</h3>
            
            {forecasts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Chưa có dự đoán rủi ro nào</p>
                <p className="text-sm mt-2">Chạy phân tích AI từ Dashboard để xem dự đoán</p>
              </div>
            ) : (
              <div className="space-y-4">
                {forecasts.map((forecast) => (
                  <div key={forecast.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{forecast.task_name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(forecast.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(forecast.risk_level)}`}>
                        {forecast.risk_level} - {forecast.risk_percentage}%
                      </span>
                    </div>
                    
                    {forecast.predicted_delay_days > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Dự đoán trễ: <strong>{forecast.predicted_delay_days} ngày</strong>
                        </p>
                      </div>
                    )}

                    {forecast.ai_analysis && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Phân tích AI:</p>
                        <p className="text-sm text-gray-600">{forecast.ai_analysis}</p>
                      </div>
                    )}

                    {forecast.recommendations && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Khuyến nghị:</p>
                        <p className="text-sm text-gray-600">{forecast.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={project}
        onSuccess={fetchProjectData}
      />

      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        project={project}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
