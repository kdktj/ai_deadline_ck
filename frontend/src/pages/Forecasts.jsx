import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Filter,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';

export default function Forecasts() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecasts, setForecasts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredForecasts, setFilteredForecasts] = useState([]);
  const [filters, setFilters] = useState({
    risk_level: '',
    project_id: '',
  });
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [forecasts, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [forecastsRes, projectsRes] = await Promise.all([
        apiService.getForecasts(),
        apiService.getProjects(),
      ]);
      setForecasts(forecastsRes.data.forecasts || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...forecasts];

    if (filters.risk_level) {
      filtered = filtered.filter(f => f.risk_level === filters.risk_level);
    }

    if (filters.project_id) {
      filtered = filtered.filter(f => {
        // Find task's project (this requires task info)
        // For now, we'll need to check if task belongs to project
        return true; // TODO: Implement proper project filtering
      });
    }

    setFilteredForecasts(filtered);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await apiService.analyzeForecast();
      toast.success('Phân tích hoàn tất!');
      await fetchData();
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error(error.response?.data?.detail || 'Không thể phân tích. Vui lòng thử lại.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskLabel = (level) => {
    const labels = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Nghiêm trọng',
    };
    return labels[level] || level;
  };

  const handleViewDetail = (forecast) => {
    setSelectedForecast(forecast);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dự đoán rủi ro</h1>
          <p className="text-gray-600 mt-1">Phân tích AI về rủi ro trễ deadline</p>
        </div>
        <Button
          onClick={handleAnalyze}
          loading={analyzing}
          disabled={analyzing}
        >
          <RefreshCw size={18} className="mr-2" />
          Phân tích lại
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Mức độ rủi ro"
            value={filters.risk_level}
            onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'low', label: 'Thấp' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'high', label: 'Cao' },
              { value: 'critical', label: 'Nghiêm trọng' },
            ]}
          />

          <Select
            label="Dự án"
            value={filters.project_id}
            onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
            options={[
              { value: '', label: 'Tất cả dự án' },
              ...projects.map(p => ({ value: p.id, label: p.name })),
            ]}
          />

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({ risk_level: '', project_id: '' })}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tổng số phân tích</span>
            <AlertTriangle className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{forecasts.length}</p>
        </div>

        {['critical', 'high', 'medium', 'low'].map((level) => {
          const count = forecasts.filter(f => f.risk_level === level).length;
          const colors = {
            critical: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600' },
            high: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600' },
            medium: { bg: 'bg-yellow-50', text: 'text-yellow-900', icon: 'text-yellow-600' },
            low: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
          };
          
          return (
            <div key={level} className={`${colors[level].bg} rounded-lg shadow p-4`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getRiskLabel(level)}</span>
                <TrendingUp className={`w-5 h-5 ${colors[level].icon}`} />
              </div>
              <p className={`text-2xl font-bold ${colors[level].text} mt-2`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Forecasts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredForecasts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có dự đoán rủi ro nào</p>
            <p className="text-sm text-gray-500 mt-2">
              Click "Phân tích lại" để chạy phân tích AI
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Task</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mức độ rủi ro</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tỷ lệ rủi ro</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Dự đoán trễ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày phân tích</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredForecasts.map((forecast) => (
                  <tr key={forecast.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{forecast.task_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(forecast.risk_level)}`}>
                        {getRiskLabel(forecast.risk_level)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                          <div
                            className={`h-2 rounded-full ${
                              forecast.risk_percentage > 70 ? 'bg-red-600' : 
                              forecast.risk_percentage > 50 ? 'bg-orange-600' : 
                              forecast.risk_percentage > 30 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${forecast.risk_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[45px]">
                          {forecast.risk_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {forecast.predicted_delay_days > 0 ? (
                        <span className="text-red-600 font-medium">
                          {forecast.predicted_delay_days} ngày
                        </span>
                      ) : (
                        <span className="text-green-600">Đúng hạn</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(forecast.created_at).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(forecast)}
                      >
                        <Eye size={16} className="mr-1" />
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedForecast && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedForecast(null);
          }}
          title="Chi tiết dự đoán rủi ro"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Task:</h3>
              <p className="text-gray-700">{selectedForecast.task_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mức độ rủi ro:</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selectedForecast.risk_level)}`}>
                  {getRiskLabel(selectedForecast.risk_level)}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tỷ lệ rủi ro:</h3>
                <p className="text-gray-700 font-bold text-lg">{selectedForecast.risk_percentage}%</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Dự đoán trễ:</h3>
                <p className={`font-bold text-lg ${selectedForecast.predicted_delay_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedForecast.predicted_delay_days > 0 
                    ? `${selectedForecast.predicted_delay_days} ngày` 
                    : 'Đúng hạn'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ngày phân tích:</h3>
                <p className="text-gray-700">{new Date(selectedForecast.created_at).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            {selectedForecast.ai_analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🤖 Phân tích AI:
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedForecast.ai_analysis}</p>
              </div>
            )}

            {selectedForecast.recommendations && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  💡 Khuyến nghị:
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedForecast.recommendations}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
