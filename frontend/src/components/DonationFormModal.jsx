import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api, { extractErrorMessage, resolveImageUrl } from '../services/api';
import {
  DONATION_CATEGORIES,
  DONATION_UNITS,
  toDateTimeLocalInput,
} from '../utils/formatters';

const getDefaultTimes = () => {
  const now = new Date();
  const prep = new Date(now.getTime() - 60 * 60 * 1000);
  const pickup = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const useBy = new Date(now.getTime() + 18 * 60 * 60 * 1000);
  return {
    preparedAt: toDateTimeLocalInput(prep),
    pickupDeadline: toDateTimeLocalInput(pickup),
    useBy: toDateTimeLocalInput(useBy),
  };
};

const DonationFormModal = ({ isOpen, onClose, initialDonation = null, onSaved }) => {
  const isEditing = Boolean(initialDonation);
  const [form, setForm] = useState({
    foodName: '',
    category: DONATION_CATEGORIES[0],
    description: '',
    quantity: 10,
    unit: 'servings',
    pickupLocation: '',
    preparedAt: '',
    useBy: '',
    pickupDeadline: '',
    allergenInformation: 'None specified',
    storageInformation: 'Keep refrigerated / food-safe container',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setImageFile(null);

    if (initialDonation) {
      setForm({
        foodName: initialDonation.foodName || '',
        category: initialDonation.category || DONATION_CATEGORIES[0],
        description: initialDonation.description || '',
        quantity: initialDonation.quantity || 1,
        unit: initialDonation.unit || 'servings',
        pickupLocation: initialDonation.pickupLocation || '',
        preparedAt: toDateTimeLocalInput(initialDonation.preparedAt),
        useBy: toDateTimeLocalInput(initialDonation.useBy),
        pickupDeadline: toDateTimeLocalInput(initialDonation.pickupDeadline),
        allergenInformation: initialDonation.allergenInformation || '',
        storageInformation: initialDonation.storageInformation || '',
      });
      setImagePreview(resolveImageUrl(initialDonation.image));
    } else {
      const defaults = getDefaultTimes();
      setForm({
        foodName: '',
        category: DONATION_CATEGORIES[0],
        description: '',
        quantity: 20,
        unit: 'servings',
        pickupLocation: '',
        ...defaults,
        allergenInformation: 'None specified',
        storageInformation: 'Keep refrigerated / food-safe container',
      });
      setImagePreview('');
    }
  }, [isOpen, initialDonation]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(form.useBy) < new Date(form.preparedAt)) {
      setError('Use-by deadline must be after preparation date.');
      return;
    }
    if (new Date(form.pickupDeadline) > new Date(form.useBy)) {
      setError('Pickup deadline cannot be later than use-by deadline.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (['preparedAt', 'useBy', 'pickupDeadline'].includes(k) && v) {
          payload.append(k, new Date(v).toISOString());
        } else {
          payload.append(k, v);
        }
      });
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (isEditing) {
        await api.put(`/donations/${initialDonation._id}`, payload);
      } else {
        await api.post('/donations', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: '1.3rem' }}>
            {isEditing ? 'Edit Surplus Food Listing' : 'Publish Surplus Food Donation'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Food Name *</label>
              <input
                name="foodName"
                className="form-control"
                value={form.foodName}
                onChange={handleChange}
                placeholder="e.g., Vegetable Biryani Trays"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-control"
                value={form.category}
                onChange={handleChange}
              >
                {DONATION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Packaging details, freshness, dietary notes..."
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                name="quantity"
                min={1}
                className="form-control"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit *</label>
              <select
                name="unit"
                className="form-control"
                value={form.unit}
                onChange={handleChange}
              >
                {DONATION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pickup Location *</label>
            <input
              name="pickupLocation"
              className="form-control"
              value={form.pickupLocation}
              onChange={handleChange}
              placeholder="Full pickup street address & landmark"
              required
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Prepared At *</label>
              <input
                type="datetime-local"
                name="preparedAt"
                className="form-control"
                value={form.preparedAt}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Deadline *</label>
              <input
                type="datetime-local"
                name="pickupDeadline"
                className="form-control"
                value={form.pickupDeadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Use-By Deadline *</label>
              <input
                type="datetime-local"
                name="useBy"
                className="form-control"
                value={form.useBy}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Allergen Information</label>
              <input
                name="allergenInformation"
                className="form-control"
                value={form.allergenInformation}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Information</label>
              <input
                name="storageInformation"
                className="form-control"
                value={form.storageInformation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Food Photo (Optional)</label>
            <label
              style={{
                border: '1px dashed var(--forest-mid)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                background: 'var(--mint-soft)',
              }}
            >
              <Upload size={18} color="var(--forest)" />
              <span style={{ fontSize: '0.88rem', color: 'var(--forest)' }}>
                {imageFile ? imageFile.name : 'Choose JPG, PNG, or WebP image (max 5 MB)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  marginTop: 10,
                  height: 120,
                  width: 200,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update Listing' : 'Publish Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationFormModal;
