import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Activity, CheckCircle, XCircle, Clock, Filter, Eye } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

export default function AutomationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, workflowFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (workflowFilter) params.workflow_name = workflowFilter;
      
      const response = await apiService.getAutomationLogs(params);
      // Backend returns {logs: [], total: ...}
      setLogs(response.data?.logs || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải automation logs. Vui lòng thử lại.');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600" size={20} />;
      case 'running':
        return <Clock className="text-blue-600 animate-spin" size={20} />;
      default:
        return <Activity className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      success: 'Thành công',
      failed: 'Thất bại',
      running: 'Đang chạy',
    };
    return labels[status] || status;
  };

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automation Logs</h1>
        <p className="text-gray-600 mt-1">
          Lịch sử thực thi các n8n workflows
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="success">Thành công</option>
          <option value="failed">Thất bại</option>
          <option value="running">Đang chạy</option>
        </select>

        <input
          type="text"
          value={workflowFilter}
          onChange={(e) => setWorkflowFilter(e.target.value)}
          placeholder="Tìm theo tên workflow..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có log nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Automation logs sẽ xuất hiện khi các workflow chạy
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(log.status)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {log.workflow_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.executed_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailModal(true);
                      }}
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          title="Chi tiết Automation Log"
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Workflow:</label>
                <p className="text-gray-900 font-medium">{selectedLog.workflow_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Trạng thái:</label>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                  {getStatusLabel(selectedLog.status)}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Thời gian thực thi:</label>
                <p className="text-gray-900">
                  {new Date(selectedLog.created_at || selectedLog.executed_at).toLocaleString('vi-VN')}
                </p>
              </div>

              {selectedLog.execution_time_ms && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Thời gian chạy:</label>
                  <p className="text-gray-900">{selectedLog.execution_time_ms} ms</p>
                </div>
              )}
            </div>

            {selectedLog.input_data && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">📥 Input Data:</label>
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-64">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(selectedLog.input_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {selectedLog.output_data && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">📤 Output Data:</label>
                <div className="bg-gray-900 text-blue-400 rounded-lg p-4 overflow-auto max-h-64">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(selectedLog.output_data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {selectedLog.error_message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <label className="text-sm font-medium text-red-700 block mb-2">❌ Error Message:</label>
                <p className="text-sm text-red-700 font-mono">
                  {selectedLog.error_message}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
