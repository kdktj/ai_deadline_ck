import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp,
  Loader2,
  Bot
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/domain/StatCard';
import { Card, Badge } from '../components/common';
import { getStatusColor, getStatusLabel, formatDate } from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    highRiskTasks: 0,
    completionRate: 0,
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [riskTasks, setRiskTasks] = useState([]);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [projectsRes, tasksRes, forecastsRes] = await Promise.all([
        apiService.getProjects().catch((err) => {
          console.error('Failed to fetch projects:', err);
          return { data: { projects: [], total: 0 } };
        }),
        apiService.getTasks().catch((err) => {
          console.error('Failed to fetch tasks:', err);
          return { data: { tasks: [], total: 0 } };
        }),
        apiService.getLatestForecasts().catch((err) => {
          console.error('Failed to fetch forecasts:', err);
          return { data: { forecasts: [], total: 0 } };
        })
      ]);

      // Backend returns {projects: [], total: ...}, {tasks: [], total: ...}, {forecasts: [], total: ...}
      const projectsData = projectsRes.data?.projects || [];
      const tasksData = tasksRes.data?.tasks || [];
      const forecastsData = forecastsRes.data?.forecasts || [];
      
      console.log('Dashboard data fetched:', {
        projects: projectsData.length,
        tasks: tasksData.length,
        forecasts: forecastsData.length
      });

      setProjects(projectsData);
      setTasks(tasksData);

      // Calculate stats
      const doneTasks = tasksData.filter(t => t.status === 'done').length;
      const completionRate = tasksData.length > 0 
        ? ((doneTasks / tasksData.length) * 100).toFixed(1)
        : 0;

      // Find high risk tasks from forecasts
      const highRisk = forecastsData.filter(f => 
        f.risk_level === 'high' || f.risk_level === 'critical'
      );

      setStats({
        totalProjects: projectsData.length,
        totalTasks: tasksData.length,
        highRiskTasks: highRisk.length,
        completionRate: parseFloat(completionRate),
      });

      setRiskTasks(highRisk.slice(0, 5)); // Top 5 high risk tasks

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (tasks.length === 0) {
      toast.warning('Không có task nào để phân tích');
      return;
    }

    setAnalyzingAI(true);
    try {
      await apiService.analyzeForecast();
      toast.success('Đã hoàn thành phân tích rủi ro bằng AI!');
      
      // Refresh data to show new forecasts
      await fetchDashboardData();
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast.error(error.response?.data?.detail || 'Không thể phân tích rủi ro. Vui lòng thử lại.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  // Prepare chart data
  const getStatusChartData = () => {
    const statusCount = {
      todo: 0,
      in_progress: 0,
      done: 0,
      blocked: 0,
    };

    tasks.forEach(task => {
      if (statusCount.hasOwnProperty(task.status)) {
        statusCount[task.status]++;
      }
    });

    return [
      { name: getStatusLabel('todo'), value: statusCount.todo, color: '#9CA3AF' },
      { name: getStatusLabel('in_progress'), value: statusCount.in_progress, color: '#3B82F6' },
      { name: getStatusLabel('done'), value: statusCount.done, color: '#10B981' },
      { name: getStatusLabel('blocked'), value: statusCount.blocked, color: '#EF4444' },
    ];
  };

  const getProjectProgressData = () => {
    return projects.slice(0, 5).map(project => {
      // Calculate progress from completed_tasks / total_tasks
      const progress = project.total_tasks > 0 
        ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
        : 0;
      
      return {
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        'Tiến độ': progress,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-600 mt-1">Thống kê và theo dõi tiến độ dự án</p>
        </div>
        <button
          onClick={handleAIAnalysis}
          disabled={analyzingAI || tasks.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {analyzingAI ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Bot className="w-5 h-5" />
              🤖 Phân tích rủi ro bằng AI
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số dự án"
          value={stats.totalProjects}
          icon={FolderKanban}
          color="blue"
          description="dự án đang hoạt động"
        />
        <StatCard
          title="Tổng số công việc"
          value={stats.totalTasks}
          icon={CheckSquare}
          color="green"
          description="công việc"
        />
        <StatCard
          title="Rủi ro cao"
          value={stats.highRiskTasks}
          icon={AlertTriangle}
          color="red"
          description="công việc cần chú ý"
        />
        <StatCard
          title="Tỷ lệ hoàn thành"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          color="purple"
          trend="up"
          description="so với kế hoạch"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Chart */}
        <Card title="Tiến độ dự án" subtitle="Top 5 dự án">
          {getProjectProgressData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getProjectProgressData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tiến độ" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Chưa có dữ liệu dự án
            </div>
          )}
        </Card>

        {/* Task Status Distribution */}
        <Card title="Phân bố trạng thái" subtitle="Công việc theo trạng thái">
          {tasks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Chưa có dữ liệu công việc
            </div>
          )}
        </Card>
      </div>

      {/* High Risk Tasks */}
      {riskTasks.length > 0 && (
        <Card 
          title="Công việc có rủi ro cao" 
          subtitle="Cần ưu tiên xử lý"
        >
          <div className="space-y-4">
            {riskTasks.map((forecast) => {
              const task = tasks.find(t => t.id === forecast.task_id);
              if (!task) return null;

              return (
                <div 
                  key={forecast.id}
                  className="p-4 border border-red-200 bg-red-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/tasks')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {task.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {forecast.analysis || 'Đang phân tích...'}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <span className="text-gray-500">
                          Deadline: {formatDate(task.deadline)}
                        </span>
                        {forecast.predicted_delay_days > 0 && (
                          <span className="text-red-600 font-medium">
                            Dự đoán trễ {forecast.predicted_delay_days} ngày
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Rủi ro: {forecast.risk_percentage}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có dự án nào
            </h3>
            <p className="text-gray-600 mb-4">
              Bắt đầu bằng cách tạo dự án đầu tiên của bạn
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo dự án mới
            </button>
          </div>
        </Card>
      )}

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Gợi ý:</strong> Hệ thống AI đang phân tích các công việc của bạn mỗi 
          1-2 phút. Các cảnh báo sẽ được gửi tự động khi phát hiện nguy cơ trễ deadline.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
