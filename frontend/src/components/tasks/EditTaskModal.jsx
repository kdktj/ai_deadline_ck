import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/api';

export default function EditTaskModal({ isOpen, onClose, task, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    assigned_to: '',
    priority: 'medium',
    status: 'todo',
    progress: 0,
    estimated_hours: '',
    actual_hours: '',
    deadline: '',
  });

  useEffect(() => {
    if (task && isOpen) {
      fetchData();
      setFormData({
        name: task.name || '',
        description: task.description || '',
        project_id: task.project_id || '',
        assigned_to: task.assigned_to || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        progress: task.progress || 0,
        estimated_hours: task.estimated_hours || '',
        actual_hours: task.actual_hours || '',
        deadline: task.deadline || '',
      });
    }
  }, [task, isOpen]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [projectsRes, usersRes] = await Promise.all([
        apiService.getProjects(),
        apiService.getAllUsers(),
      ]);
      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên task là bắt buộc';
    }

    if (!formData.project_id) {
      newErrors.project_id = 'Vui lòng chọn dự án';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Tiến độ phải từ 0-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        progress: parseInt(formData.progress),
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : null,
        deadline: formData.deadline || null,
      };

      await apiService.updateTask(task.id, dataToSubmit);
      toast.success('Cập nhật task thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.detail || 'Không thể cập nhật task. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa task"
      size="lg"
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
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            Lưu thay đổi
          </Button>
        </>
      }
    >
      {loadingData ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên task"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên task"
            required
            error={errors.name}
          />

          <Textarea
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Nhập mô tả chi tiết"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Dự án"
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              required
              error={errors.project_id}
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />

            <Select
              label="Người phụ trách"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              options={users.map(u => ({ value: u.id, label: u.full_name || u.username }))}
              placeholder="Chọn người"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Độ ưu tiên"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[
                { value: 'low', label: 'Thấp' },
                { value: 'medium', label: 'Trung bình' },
                { value: 'high', label: 'Cao' },
                { value: 'critical', label: 'Khẩn cấp' },
              ]}
            />

            <Select
              label="Trạng thái"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'todo', label: 'Chưa bắt đầu' },
                { value: 'in_progress', label: 'Đang thực hiện' },
                { value: 'done', label: 'Hoàn thành' },
                { value: 'blocked', label: 'Bị chặn' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Tiến độ (%)"
              name="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              error={errors.progress}
            />

            <Input
              label="Ước tính (giờ)"
              name="estimated_hours"
              type="number"
              step="0.5"
              min="0"
              value={formData.estimated_hours}
              onChange={handleChange}
            />

            <Input
              label="Thực tế (giờ)"
              name="actual_hours"
              type="number"
              step="0.5"
              min="0"
              value={formData.actual_hours}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />
        </form>
      )}
    </Modal>
  );
}
