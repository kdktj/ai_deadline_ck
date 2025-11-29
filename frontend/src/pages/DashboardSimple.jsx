import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching dashboard data...');
        const [projectsRes, tasksRes] = await Promise.all([
          apiService.getProjects().catch(e => {
            console.error('Projects error:', e);
            return { data: { projects: [], total: 0 } };
          }),
          apiService.getTasks().catch(e => {
            console.error('Tasks error:', e);
            return { data: { tasks: [], total: 0 } };
          })
        ]);

        const projects = projectsRes.data?.projects || [];
        const tasks = tasksRes.data?.tasks || [];
        
        console.log('Projects:', projects.length);
        console.log('Tasks:', tasks.length);
        
      } catch (error) {
        console.error('Dashboard error:', error);
        setError(error.message);
        if (toast) {
          toast.error('Không thể tải dữ liệu tổng quan');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Có lỗi xảy ra</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Dashboard đang hoạt động!</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <p className="text-gray-600">
          Trang Dashboard đã load thành công. Các components phức tạp sẽ được thêm sau.
        </p>
        
        <div className="mt-4 space-y-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Xem Dự án
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Xem Công việc
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Gợi ý:</strong> Dashboard đầy đủ với biểu đồ đang được phát triển.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
