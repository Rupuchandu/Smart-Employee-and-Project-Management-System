import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, Phone, Lock, Save, KeyRound, ShieldCheck, Mail, Camera, Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const profileSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().required('Phone is required').matches(/^[0-9]{10}$/, 'Must be exactly 10 digits'),
}).required();

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Must contain uppercase, lowercase, number, special char'),
}).required();

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileToast, setProfileToast] = useState({ type: '', message: '' });
  const [passwordToast, setPasswordToast] = useState({ type: '', message: '' });
  const [photoToast, setPhotoToast] = useState({ type: '', message: '' });
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setLoadingProfile(true);
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const uData = response.data.data;
        setProfileData(uData);
        resetProfile({
          firstName: uData.firstName || '',
          lastName: uData.lastName || '',
          phone: uData.phone || '',
        });
      }
    } catch (err) {
      setProfileToast({ type: 'error', message: err.response?.data?.message || 'Failed to load user profile' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoToast({ type: 'error', message: 'Please select a valid image file (PNG, JPG, JPEG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoToast({ type: 'error', message: 'Image size should not exceed 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoToast({ type: '', message: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoPreview) {
      setPhotoToast({ type: 'error', message: 'Please select a photo first!' });
      return;
    }

    setUploadingPhoto(true);
    setPhotoToast({ type: '', message: '' });

    try {
      const response = await api.post('/users/profile-photo', { photo: photoPreview });
      if (response.data.success) {
        setPhotoToast({
          type: 'success',
          message: 'Profile photo submitted successfully! Pending admin approval.',
        });
        setPhotoPreview(null);
        fetchProfileDetails();
      }
    } catch (err) {
      setPhotoToast({ type: 'error', message: err.response?.data?.message || 'Failed to upload photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onUpdateProfile = async (data) => {
    setSavingProfile(true);
    setProfileToast({ type: '', message: '' });
    try {
      const response = await api.put('/users/profile', data);
      if (response.data.success) {
        const updatedUser = response.data.data;
        updateUser({
          ...user,
          name: updatedUser.firstName + ' ' + updatedUser.lastName,
          phone: updatedUser.phone,
        });
        setProfileToast({ type: 'success', message: 'Profile updated successfully!' });
        fetchProfileDetails();
      }
    } catch (err) {
      setProfileToast({ type: 'error', message: err.response?.data?.message || 'Profile update failed' });
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    setSavingPassword(true);
    setPasswordToast({ type: '', message: '' });
    try {
      const response = await api.put('/users/change-password', data);
      if (response.data.success) {
        setPasswordToast({ type: 'success', message: 'Password changed successfully!' });
        resetPassword();
      }
    } catch (err) {
      setPasswordToast({ type: 'error', message: err.response?.data?.message || 'Password change failed' });
    } finally {
      setSavingPassword(false);
    }
  };

  const onInvalidProfile = (errs) => {
    const firstMsg = Object.values(errs)[0]?.message;
    if (firstMsg) {
      setProfileToast({ type: 'error', message: `Profile Validation Error: ${firstMsg}` });
    }
  };

  const onInvalidPassword = (errs) => {
    const firstMsg = Object.values(errs)[0]?.message;
    if (firstMsg) {
      setPasswordToast({ type: 'error', message: `Password Validation Error: ${firstMsg}` });
    }
  };

  if (loadingProfile) {
    return <Loader message="Fetching user profile..." />;
  }

  const pStatus = profileData?.photoStatus || 'NONE';
  const displayPhoto = profileData?.profilePhoto || photoPreview || null;
  const pendingPhoto = profileData?.pendingProfilePhoto || photoPreview || null;

  return (
    <div>
      <div className="row g-4">
        {/* Profile Card Summary & Photo Management */}
        <div className="col-12 col-lg-5">
          <div className="stat-card text-center p-4 mb-4">
            <div className="position-relative d-inline-block mx-auto mb-3">
              {pStatus === 'APPROVED' && profileData?.profilePhoto ? (
                <img
                  src={profileData.profilePhoto}
                  alt="Profile"
                  className="rounded-circle border border-3 border-success shadow"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (pStatus === 'PENDING' || photoPreview) && pendingPhoto ? (
                <img
                  src={pendingPhoto}
                  alt="Pending Profile"
                  className="rounded-circle border border-3 border-warning shadow"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="avatar bg-primary bg-opacity-25 text-primary rounded-circle mx-auto d-flex align-items-center justify-content-center font-extrabold shadow"
                  style={{ width: '120px', height: '120px', fontSize: '3rem' }}
                >
                  {profileData?.firstName ? profileData.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            <h4 className="font-extrabold text-white mb-1">
              {profileData?.firstName} {profileData?.lastName}
            </h4>
            <p className="text-muted small mb-2">{profileData?.email}</p>

            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mb-3">
              <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 px-3 py-2 rounded-pill font-semibold">
                <ShieldCheck size={14} className="me-1" /> Role: {profileData?.role || user?.role}
              </span>

              {pStatus === 'APPROVED' && (
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-3 py-2 rounded-pill font-semibold">
                  <CheckCircle2 size={14} className="me-1" /> Photo Approved
                </span>
              )}
              {pStatus === 'PENDING' && (
                <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 px-3 py-2 rounded-pill font-semibold">
                  <Clock size={14} className="me-1" /> Photo Pending Admin Approval
                </span>
              )}
              {pStatus === 'REJECTED' && (
                <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 px-3 py-2 rounded-pill font-semibold">
                  <XCircle size={14} className="me-1" /> Photo Rejected
                </span>
              )}
            </div>

            <div className="border-top border-secondary border-opacity-25 pt-3 text-start small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">First Name:</span>
                <span className="fw-bold text-white">{profileData?.firstName}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Last Name:</span>
                <span className="fw-bold text-white">{profileData?.lastName}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Mobile Number:</span>
                <span className="fw-bold text-white">{profileData?.phone || 'N/A'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Age:</span>
                <span className="fw-bold text-white">{profileData?.age ? `${profileData.age} years` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Profile Photo Upload Card */}
          <div className="stat-card p-4">
            <h5 className="font-bold text-white mb-3 d-flex align-items-center gap-2">
              <Camera size={20} className="text-primary" />
              Upload Profile Photo
            </h5>

            {photoToast.message && (
              <Toast type={photoToast.type} message={photoToast.message} onClose={() => setPhotoToast({ type: '', message: '' })} />
            )}

            {pStatus === 'PENDING' && (
              <div className="alert alert-warning small border border-warning border-opacity-50 bg-warning bg-opacity-10 text-warning rounded-3 mb-3 d-flex align-items-start gap-2">
                <Clock size={18} className="flex-shrink-0 mt-1" />
                <div>
                  <strong>Approval Pending:</strong> Your submitted profile photo is currently awaiting administrator review. Once approved by the admin, it will stay on your profile.
                </div>
              </div>
            )}

            {pStatus === 'REJECTED' && (
              <div className="alert alert-danger small border border-danger border-opacity-50 bg-danger bg-opacity-10 text-danger rounded-3 mb-3 d-flex align-items-start gap-2">
                <XCircle size={18} className="flex-shrink-0 mt-1" />
                <div>
                  <strong>Photo Rejected:</strong> Your previous profile photo request was rejected by the administrator. Please upload another profile photo below.
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small text-muted">Select New Image File</label>
              <input type="file" className="form-control" accept="image/*" onChange={handlePhotoSelect} />
            </div>

            {photoPreview && (
              <div className="text-center my-3">
                <p className="small text-muted mb-2">New Photo Preview:</p>
                <img src={photoPreview} alt="Preview" className="rounded-circle border border-primary" style={{ width: '90px', height: '90px', objectFit: 'cover' }} />
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleUploadPhoto}
              disabled={uploadingPhoto || !photoPreview}
            >
              <Camera size={18} />
              <span>{uploadingPhoto ? 'Submitting...' : 'Submit Photo for Admin Approval'}</span>
            </button>
          </div>
        </div>

        {/* Profile Information & Security Forms */}
        <div className="col-12 col-lg-7">
          {/* Edit Profile Information */}
          <div className="stat-card mb-4">
            <h5 className="font-bold text-white mb-3 d-flex align-items-center gap-2">
              <User size={20} className="text-primary" />
              Update Profile Information
            </h5>

            {profileToast.message && (
              <Toast type={profileToast.type} message={profileToast.message} onClose={() => setProfileToast({ type: '', message: '' })} />
            )}

            <form onSubmit={handleSubmitProfile(onUpdateProfile, onInvalidProfile)} noValidate>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">First Name</label>
                  <input type="text" className={`form-control ${profileErrors.firstName ? 'is-invalid' : ''}`} {...registerProfile('firstName')} />
                  {profileErrors.firstName && <div className="invalid-feedback">{profileErrors.firstName.message}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Last Name</label>
                  <input type="text" className={`form-control ${profileErrors.lastName ? 'is-invalid' : ''}`} {...registerProfile('lastName')} />
                  {profileErrors.lastName && <div className="invalid-feedback">{profileErrors.lastName.message}</div>}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email Address (Read Only)</label>
                  <input type="email" className="form-control text-muted" value={profileData?.email || user?.email || ''} disabled />
                </div>
                <div className="col-md-6 mb-4">
                  <label className="form-label">Mobile Number (10 Digits)</label>
                  <input type="text" className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`} maxLength="10" {...registerProfile('phone')} />
                  {profileErrors.phone && <div className="invalid-feedback">{profileErrors.phone.message}</div>}
                </div>
              </div>

              <button type="submit" className="btn btn-primary-custom d-flex align-items-center gap-2" disabled={savingProfile}>
                <Save size={18} />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="stat-card">
            <h5 className="font-bold text-white mb-3 d-flex align-items-center gap-2">
              <KeyRound size={20} className="text-warning" />
              Security & Change Password
            </h5>

            {passwordToast.message && (
              <Toast type={passwordToast.type} message={passwordToast.message} onClose={() => setPasswordToast({ type: '', message: '' })} />
            )}

            <form onSubmit={handleSubmitPassword(onChangePassword, onInvalidPassword)} noValidate>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input type="password" className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`} placeholder="••••••••" {...registerPassword('currentPassword')} />
                {passwordErrors.currentPassword && <div className="invalid-feedback">{passwordErrors.currentPassword.message}</div>}
              </div>

              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`} placeholder="••••••••" {...registerPassword('newPassword')} />
                  {passwordErrors.newPassword && <div className="invalid-feedback">{passwordErrors.newPassword.message}</div>}
                </div>
              </div>

              <button type="submit" className="btn btn-outline-warning d-flex align-items-center gap-2 rounded-3 py-2 px-4 fw-bold" disabled={savingPassword}>
                <KeyRound size={18} />
                <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
