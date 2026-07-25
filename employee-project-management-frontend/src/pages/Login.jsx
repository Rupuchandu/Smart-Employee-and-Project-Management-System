import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const loginSchema = yup.object({
  email: yup.string().required('Username or Email address is required'),
  password: yup.string().required('Password is required'),
}).required();

const Login = () => {
  const [toast, setToast] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: 'admin@gmail.com',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let inputEmail = data.email.trim();
      // Handle username or email formats (e.g. 'admin' -> 'admin@gmail.com')
      if (!inputEmail.includes('@')) {
        if (inputEmail.toLowerCase() === 'admin') {
          inputEmail = 'admin@gmail.com';
        } else {
          inputEmail = `${inputEmail}@gmail.com`;
        }
      }

      const result = await login(inputEmail, data.password);
      if (result.success) {
        setToast({ type: 'success', message: 'Login successful! Redirecting...' });
        navigate('/dashboard', { replace: true });
      } else {
        setToast({
          type: 'error',
          message: result.message || 'Invalid Username/Email or Password',
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Invalid Username/Email or Password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'var(--bg-body)' }}>
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />}

      <div className="stat-card shadow-lg border-secondary p-4 p-md-5" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="brand-logo mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h3 className="font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome Back</h3>
          <p className="text-muted small">Sign in to Smart EPMS Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="form-label small font-semibold">Username or Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent text-muted"><Mail size={18} /></span>
              <input
                type="text"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="admin@gmail.com"
                {...register('email')}
              />
            </div>
            {errors.email && <div className="text-danger small mt-1">{errors.email.message}</div>}
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small font-semibold mb-0">Password</label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-transparent text-muted"><Lock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                {...register('password')}
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0 text-muted"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <div className="text-danger small mt-1">{errors.password.message}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
          <span className="text-muted small">Don't have an account? </span>
          <Link to="/signup" className="text-primary font-semibold text-decoration-none small">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
