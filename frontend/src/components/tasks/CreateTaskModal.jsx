import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/api';

export default function CreateTaskModal({ isOpen, onClose, onSuccess, defaultProjectId = null }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: defaultProjectId || '',
    assigned_to: '',
    priority: 'medium',
    status: 'todo',
    estimated_hours: '',
    deadline: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (defaultProjectId) {
        setFormData(prev => ({ ...prev, project_id: defaultProjectId }));
      }
    }
  }, [isOpen, defaultProjectId]);

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
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
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

    if (formData.estimated_hours && formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Số giờ phải lớn hơn 0';
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
      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...formData,
        project_id: parseInt(formData.project_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        deadline: formData.deadline || null,
      };

      await apiService.createTask(dataToSubmit);
      toast.success('Tạo task thành công!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.detail || 'Không thể tạo task. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      project_id: defaultProjectId || '',
      assigned_to: '',
      priority: 'medium',
      status: 'todo',
      estimated_hours: '',
      deadline: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo task mới"
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            Tạo task
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
            placeholder="Nhập mô tả chi tiết (tùy chọn)"
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
              placeholder="Chọn dự án"
            />

            <Select
              label="Người phụ trách"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              options={users.map(u => ({ value: u.id, label: u.full_name || u.username }))}
              placeholder="Chọn người (tùy chọn)"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ước tính (giờ)"
              name="estimated_hours"
              type="number"
              step="0.5"
              min="0"
              value={formData.estimated_hours}
              onChange={handleChange}
              placeholder="Số giờ dự kiến"
              error={errors.estimated_hours}
            />

            <Input
              label="Deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            💡 <strong>Mẹo:</strong> Task có deadline và progress sẽ được AI phân tích rủi ro tự động.
          </div>
        </form>
      )}
    </Modal>
  );
}
