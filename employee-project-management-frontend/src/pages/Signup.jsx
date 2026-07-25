import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, User, Phone, ArrowRight, DollarSign, Calendar, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const signupSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .matches(/^[a-zA-Z\s]+$/, 'First name must contain only alphabets')
    .min(3, 'First name must be at least 3 letters')
    .max(30, 'First name cannot exceed 30 letters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .matches(/^[a-zA-Z\s]+$/, 'Last name must contain only alphabets')
    .max(30, 'Last name cannot exceed 30 letters'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Must contain uppercase, lowercase, number, and special character'),
  age: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .typeError('Age must be a number')
    .integer('Age must be an integer')
    .min(18, 'Age must be between 18 and 65')
    .max(65, 'Age must be between 18 and 65'),
  salary: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .typeError('Salary must be a positive number')
    .positive('Salary must be a positive number'),
}).required();

const Signup = () => {
  const [toast, setToast] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      age: '',
      salary: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { age, salary, ...signupPayload } = data;
      const payload = {
        ...signupPayload,
        age: age ? Number(age) : null,
        salary: salary ? Number(salary) : null,
        role: 'EMPLOYEE',
      };

      const response = await api.post('/auth/signup', payload);

      if (response.data.success) {
        setToast({
          type: 'success',
          message: 'Registration submitted successfully! Your account is pending administrator approval.',
        });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Registration failed.';

      if (serverMsg.includes('DUPLICATE_EMAIL') || serverMsg.toLowerCase().includes('email')) {
        setError('email', { type: 'manual', message: 'An employee with this email address is already registered!' });
        setToast({ type: 'error', message: 'Duplicate Error: An employee with this email address is already registered!' });
      } else if (serverMsg.includes('DUPLICATE_PHONE') || serverMsg.toLowerCase().includes('phone') || serverMsg.toLowerCase().includes('contact')) {
        setError('phone', { type: 'manual', message: 'An employee with this contact number is already registered!' });
        setToast({ type: 'error', message: 'Duplicate Error: An employee with this contact number is already registered!' });
      } else if (serverMsg.includes('DUPLICATE_NAME') || serverMsg.toLowerCase().includes('name')) {
        setError('firstName', { type: 'manual', message: 'An employee with this full name already exists in the system!' });
        setError('lastName', { type: 'manual', message: 'An employee with this full name already exists in the system!' });
        setToast({ type: 'error', message: 'Duplicate Error: An employee with this name already exists in the system!' });
      } else {
        setToast({ type: 'error', message: serverMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errs) => {
    const firstMsg = Object.values(errs)[0]?.message;
    if (firstMsg) {
      setToast({ type: 'error', message: `Validation Error: Please correct the highlighted fields below.` });
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'var(--bg-body)' }}>
      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />}

      <div className="stat-card shadow-lg border-secondary p-4 p-md-5" style={{ maxWidth: '640px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="brand-logo mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h3 className="font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>Create Account</h3>
          <p className="text-muted small">Register for Smart Employee & Project Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">First Name (Alphabets only)</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><User size={18} /></span>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                  placeholder=""
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                    if (/[0-9]/.test(e.key) || /[^a-zA-Z\s]/.test(e.key)) {
                      e.preventDefault();
                      setError('firstName', { type: 'manual', message: 'Alphabets only (numbers/symbols not allowed)' });
                    } else {
                      clearErrors('firstName');
                    }
                  }}
                  {...register('firstName')}
                />
              </div>
              {errors.firstName && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.firstName.message}
                </div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">Last Name (Alphabets only)</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><User size={18} /></span>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                  placeholder=""
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                    if (/[0-9]/.test(e.key) || /[^a-zA-Z\s]/.test(e.key)) {
                      e.preventDefault();
                      setError('lastName', { type: 'manual', message: 'Alphabets only (numbers/symbols not allowed)' });
                    } else {
                      clearErrors('lastName');
                    }
                  }}
                  {...register('lastName')}
                />
              </div>
              {errors.lastName && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.lastName.message}
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><Mail size={18} /></span>
                <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="" {...register('email')} />
              </div>
              {errors.email && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.email.message}
                </div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">Phone Number (10 Digits)</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><Phone size={18} /></span>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder=""
                  maxLength="10"
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                      setError('phone', { type: 'manual', message: 'Contact number accepts digits only' });
                    } else {
                      clearErrors('phone');
                    }
                  }}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.phone.message}
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label small font-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><Lock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder=""
                  {...register('password')}
                />
                <button
                  type="button"
                  className="input-group-text bg-transparent text-muted border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide Password" : "Show Password"}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.password.message}
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">Age (18 - 65)</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><Calendar size={18} /></span>
                <input
                  type="number"
                  className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                  placeholder=""
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                      setError('age', { type: 'manual', message: 'Age accepts digits only (18 to 65)' });
                    } else {
                      clearErrors('age');
                    }
                  }}
                  {...register('age')}
                />
              </div>
              {errors.age && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.age.message}
                </div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label small font-semibold">Expected Salary</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent text-muted"><DollarSign size={18} /></span>
                <input
                  type="number"
                  className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                  placeholder=""
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                      setError('salary', { type: 'manual', message: 'Salary accepts numeric digits only' });
                    } else {
                      clearErrors('salary');
                    }
                  }}
                  {...register('salary')}
                />
              </div>
              {errors.salary && (
                <div className="text-danger small mt-1 font-semibold d-flex align-items-center gap-1">
                  <AlertCircle size={14} /> {errors.salary.message}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary-custom w-100 py-2 mt-2 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register & Enter System'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
          <span className="text-muted small">Already have an account? </span>
          <Link to="/login" className="text-primary font-semibold text-decoration-none small">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
