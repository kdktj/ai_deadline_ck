import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/api';

export default function EditProjectModal({ isOpen, onClose, project, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'active',
      });
    }
  }, [project]);

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
      newErrors.name = 'Tên dự án là bắt buộc';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
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
      await apiService.updateProject(project.id, formData);
      toast.success('Cập nhật dự án thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.response?.data?.detail || 'Không thể cập nhật dự án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa dự án"
      size="md"
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên dự án"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nhập tên dự án"
          required
          error={errors.name}
        />

        <Textarea
          label="Mô tả"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Nhập mô tả dự án"
          rows={4}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ngày bắt đầu"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
          />

          <Input
            label="Ngày kết thúc"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            error={errors.end_date}
          />
        </div>

        <Select
          label="Trạng thái"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: 'active', label: 'Đang thực hiện' },
            { value: 'on_hold', label: 'Tạm dừng' },
            { value: 'completed', label: 'Hoàn thành' },
          ]}
        />
      </form>
    </Modal>
  );
}