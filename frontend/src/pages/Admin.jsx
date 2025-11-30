import React, { useState, useEffect } from 'react';
import {
  Users,
  Trash2,
  Eye,
  Loader2,
  Shield,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Badge, Button, Modal } from '../components/common';
import StatCard from '../components/domain/StatCard';
import { formatDate } from '../utils/formatters';

const Admin = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        apiService.adminGetAllUsers(),
        apiService.adminGetStats()
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Không thể tải dữ liệu admin');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserDetails = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    // Fetch user details if not already loaded
    if (!userDetails[userId]) {
      setLoadingDetails({ ...loadingDetails, [userId]: true });
      try {
        const res = await apiService.adminGetUserDetail(userId);
        setUserDetails({ ...userDetails, [userId]: res.data });
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast.error('Không thể tải thông tin chi tiết user');
      } finally {
        setLoadingDetails({ ...loadingDetails, [userId]: false });
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    setDeleting(true);
    try {
      await apiService.adminDeleteUser(deleteModal.user.id);
      toast.success(`Đã xóa user ${deleteModal.user.username} thành công`);
      setDeleteModal({ open: false, user: null });
      
      // Refresh data
      await fetchAdminData();
      
      // Clear user details cache
      const newDetails = { ...userDetails };
      delete newDetails[deleteModal.user.id];
      setUserDetails(newDetails);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.detail || 'Không thể xóa user');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (user) => {
    setDeleteModal({ open: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, user: null });
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      done: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || colors.todo;
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600 mt-1">Quản lý người dùng và thống kê hệ thống</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng số người dùng"
            value={stats.users.total}
            icon={Users}
            color="blue"
            description={`${stats.users.admins} admin, ${stats.users.normal_users} user`}
          />
          <StatCard
            title="Tổng số dự án"
            value={stats.projects.total}
            icon={FolderKanban}
            color="green"
            description="dự án trong hệ thống"
          />
          <StatCard
            title="Tổng số công việc"
            value={stats.tasks.total}
            icon={CheckSquare}
            color="purple"
            description={`${stats.tasks.done} đã hoàn thành`}
          />
          <StatCard
            title="Dự báo rủi ro cao"
            value={stats.forecasts.high_risk}
            icon={AlertTriangle}
            color="red"
            description={`/${stats.forecasts.total} dự báo`}
          />
        </div>
      )}

      {/* Users List */}
      <Card title="Danh sách người dùng" subtitle={`${users.length} người dùng`}>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* User Header */}
              <div className="p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === 'admin' ? '👑 Admin' : 'User'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>@{user.username}</span>
                      <span>•</span>
                      <span>{user.email}</span>
                      <span>•</span>
                      <span>Tạo: {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleUserDetails(user.id)}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Chi tiết</span>
                    {expandedUserId === user.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Xóa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* User Details (Expandable) */}
              {expandedUserId === user.id && (
                <div className="p-4 bg-white border-t border-gray-200">
                  {loadingDetails[user.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : userDetails[user.id] ? (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {userDetails[user.id].stats.total_projects}
                          </div>
                          <div className="text-xs text-gray-600">Projects</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {userDetails[user.id].stats.total_tasks}
                          </div>
                          <div className="text-xs text-gray-600">Tasks</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {userDetails[user.id].stats.completed_tasks}
                          </div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {userDetails[user.id].stats.in_progress_tasks}
                          </div>
                          <div className="text-xs text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">
                            {userDetails[user.id].stats.todo_tasks}
                          </div>
                          <div className="text-xs text-gray-600">Todo</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {userDetails[user.id].stats.high_risk_forecasts}
                          </div>
                          <div className="text-xs text-gray-600">High Risk</div>
                        </div>
                      </div>

                      {/* Projects */}
                      {userDetails[user.id].projects.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Projects ({userDetails[user.id].projects.length})
                          </h4>
                          <div className="space-y-2">
                            {userDetails[user.id].projects.map((project) => (
                              <div
                                key={project.id}
                                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">{project.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {formatDate(project.start_date)} → {formatDate(project.end_date)}
                                  </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  {project.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tasks */}
                      {userDetails[user.id].tasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Tasks ({userDetails[user.id].tasks.length})
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {userDetails[user.id].tasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{task.name}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getStatusBadgeColor(task.status)}>
                                      {task.status}
                                    </Badge>
                                    <Badge className={getPriorityBadgeColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                      {task.progress}%
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(task.deadline)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {userDetails[user.id].projects.length === 0 && userDetails[user.id].tasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          User này chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không có người dùng nào trong hệ thống
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Xác nhận xóa người dùng"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Cảnh báo: Hành động này không thể hoàn tác!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Xóa người dùng sẽ xóa toàn bộ:
                </p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Tất cả projects của user</li>
                  <li>Tất cả tasks trong các projects</li>
                  <li>Tất cả forecast logs</li>
                  <li>Tất cả simulation logs</li>
                  <li>Tất cả automation logs liên quan</li>
                </ul>
              </div>
            </div>
          </div>

          {deleteModal.user && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Bạn có chắc chắn muốn xóa người dùng:
              </p>
              <div className="mt-2 font-semibold text-gray-900">
                {deleteModal.user.full_name} (@{deleteModal.user.username})
              </div>
              <div className="text-sm text-gray-600">{deleteModal.user.email}</div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Xóa người dùng
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
