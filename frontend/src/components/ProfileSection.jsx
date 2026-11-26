import { useState, useEffect } from 'react';
import { BadgeCheck, Clock, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, resolveImageUrl } from '../services/api';

const ProfileSection = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    organizationName: '',
    address: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      organizationName: user.organizationName || '',
      address: user.address || '',
    });
    setPreview(resolveImageUrl(user.profileImage));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('organizationName', form.organizationName);
      fd.append('address', form.address);
      if (imageFile) fd.append('profileImage', imageFile);

      await updateProfile(fd);
      showToast('Profile updated successfully.');
      setImageFile(null);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="card">
      <div className="card-body">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Profile &amp; Organization Settings</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Keep your contact and pickup details up to date for seamless coordination.
            </p>
          </div>
          {user.isVerified ? (
            <span className="status-badge status-completed">
              <BadgeCheck size={14} /> Verified Account
            </span>
          ) : (
            <span className="status-badge status-requested">
              <Clock size={14} /> Pending Admin Verification
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'var(--mint-light)',
                color: 'var(--forest)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '1.3rem',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={15} /> Change Photo
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setImageFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" value={user.email} disabled />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Organization / Restaurant / NGO Name</label>
              <input
                className="form-control"
                value={form.organizationName}
                onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              className="form-control"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSection;
