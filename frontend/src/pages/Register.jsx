import { Link, Sparkles, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

	export default function Register() {
		// const navigate = useNavigate();

		const [formData, setFormData] = useState({
			email: '',
			password: '',
			full_name: ''
		});
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState('');

		const handleSubmit = (e) => {
			// UI-only submit: simulate a short delay and navigate to login with a success message.
			e.preventDefault();
			setError('');
			setLoading(true);

			// Simulate success (no backend call) so the page can run purely as UI.
			setTimeout(() => {
				setLoading(false);
				navigate('/login', {
					state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
				});
			}, 700);
		};

		return (
			<div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
				<div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-md"
				>
					<div className="text-center mb-8">
						<div
							initial={{ y: -20 }}
							animate={{ y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="inline-flex items-center gap-2 mb-4"
						>
							<Sparkles className="w-10 h-10 text-primary-600" />
							<h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
								AI Deadline
							</h1>
						</div>
						<p className="text-gray-600">Tạo tài khoản mới</p>
					</div>

					<Card>
						<h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
							<UserPlus className="w-6 h-6" />
							Đăng ký tài khoản
						</h2>

						{error && (
							<div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
							>
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								type="text"
								label="Họ tên"
								placeholder="Nguyễn Văn A"
								value={formData.full_name}
								onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
							/>

							<Input
								type="email"
								label="Email"
								placeholder="your@email.com"
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								required
							/>

							<Input
								type="password"
								label="Mật khẩu"
								placeholder="••••••••"
								value={formData.password}
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								required
							/>

							<Button
								type="submit"
								variant="primary"
								size="lg"
								className="w-full"
								loading={loading}
							>
								<UserPlus className="w-5 h-5" />
								Đăng ký
							</Button>
						</form>

						<div className="mt-6 text-center text-sm text-gray-600">
							Đã có tài khoản?{' '}
							<Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
								Đăng nhập
							</Link>
						</div>
					</Card>
				</div>
			</div>
		);
	}

