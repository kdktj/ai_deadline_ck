import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/api';
import { AlertTriangle } from 'lucide-react';

export default function DeleteTaskModal({ isOpen, onClose, task, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!task) return;

    setLoading(true);
    try {
      await apiService.deleteTask(task.id);
      toast.success('Xóa task thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error.response?.data?.detail || 'Không thể xóa task. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa task"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={loading}
          >
            Xóa task
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              Cảnh báo: Hành động này không thể hoàn tác!
            </p>
            <p className="text-sm text-red-700 mt-1">
              Task và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-700">
            Bạn có chắc chắn muốn xóa task <strong className="font-semibold">"{task?.name}"</strong>?
          </p>
        </div>
      </div>
    </Modal>
  );
}
