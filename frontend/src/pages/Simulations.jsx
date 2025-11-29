import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, History, AlertCircle, Eye } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

export default function Simulations() {
  const [projects, setProjects] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchSimulations();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects();
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchSimulations = async () => {
    try {
      const response = await apiService.getSimulations();
      // Backend returns {simulations: [], total: ...}
      setSimulations(response.data?.simulations || []);
    } catch (err) {
      console.error('Error fetching simulations:', err);
    }
  };

  const runSimulation = async (e) => {
    e.preventDefault();
    
    if (!selectedProject || !scenario) {
      setError('Vui lòng chọn dự án và nhập kịch bản');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.runSimulation({
        project_id: parseInt(selectedProject),
        scenario: scenario,
      });
      setResult(response.data);
      setScenario(''); // Reset form
      await fetchSimulations(); // Refresh history
    } catch (err) {
      setError('Không thể chạy mô phỏng. Vui lòng thử lại.');
      console.error('Error running simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (simulation) => {
    setSelectedSimulation(simulation);
    setShowDetailModal(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mô phỏng Kịch bản "What-if"</h1>
        <p className="text-gray-600 mt-1">
          Phân tích tác động của các thay đổi tiềm ẩn đến dự án
        </p>
      </div>

      {/* Simulation Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Play className="mr-2" size={20} />
          Chạy mô phỏng mới
        </h2>

        <form onSubmit={runSimulation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn dự án
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả kịch bản
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder='Ví dụ: "Nếu task Thiết kế UI chậm 5 ngày"'
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập kịch bản giả định để xem tác động đến dự án
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Đang phân tích...
              </>
            ) : (
              <>
                <Play size={20} />
                Chạy mô phỏng
              </>
            )}
          </button>
        </form>
      </div>

      {/* Simulation Result */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-green-700">
            ✅ Kết quả mô phỏng
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Kịch bản:</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{result.scenario}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tasks bị ảnh hưởng</p>
                <p className="text-2xl font-bold text-orange-600">
                  {result.affected_task_ids?.length || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tổng thời gian trễ</p>
                <p className="text-2xl font-bold text-red-600">
                  {result.total_delay_days} ngày
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Phân tích AI:</h3>
              <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-700">
                {result.analysis}
              </div>
            </div>

            {result.recommendations && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Khuyến nghị:</h3>
                <div className="bg-green-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-700">
                  {result.recommendations}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulation History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <History className="mr-2" size={20} />
          Lịch sử mô phỏng
        </h2>

        {simulations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có mô phỏng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Kịch bản</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tasks ảnh hưởng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tổng trễ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Thời gian</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {simulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 line-clamp-2">{sim.scenario_description || sim.scenario}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {sim.affected_task_ids?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        {sim.total_delay_days || 0} ngày
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sim.created_at || sim.simulated_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(sim)}
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
      {selectedSimulation && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSimulation(null);
          }}
          title="Chi tiết mô phỏng"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Kịch bản:</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {selectedSimulation.scenario_description || selectedSimulation.scenario}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Tasks bị ảnh hưởng</p>
                <p className="text-3xl font-bold text-blue-900">
                  {selectedSimulation.affected_task_ids?.length || 0}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-700 mb-1">Tổng thời gian trễ</p>
                <p className="text-3xl font-bold text-red-900">
                  {selectedSimulation.total_delay_days || 0} ngày
                </p>
              </div>
            </div>

            {selectedSimulation.ai_impact_analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🤖 Phân tích tác động AI:
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedSimulation.ai_impact_analysis}
                </p>
              </div>
            )}

            {selectedSimulation.recommendations && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  💡 Khuyến nghị:
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedSimulation.recommendations}
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                Thời gian mô phỏng: {new Date(selectedSimulation.created_at || selectedSimulation.simulated_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
