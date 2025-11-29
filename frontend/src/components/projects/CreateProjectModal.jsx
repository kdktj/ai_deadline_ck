import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/api';

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
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
      await apiService.createProject(formData);
      toast.success('Tạo dự án thành công!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.detail || 'Không thể tạo dự án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo dự án mới"
      size="md"
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
            Tạo dự án
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
          placeholder="Nhập mô tả dự án (tùy chọn)"
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

        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          💡 <strong>Mẹo:</strong> Sau khi tạo dự án, bạn có thể thêm các task vào trang chi tiết dự án.
        </div>
      </form>
    </Modal>
  );
}
