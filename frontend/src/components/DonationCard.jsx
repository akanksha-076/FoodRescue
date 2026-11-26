import { Link } from 'react-router-dom';
import { MapPin, Clock, Package, Building2, BadgeCheck, Utensils, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { resolveImageUrl } from '../services/api';
import { formatTimeRemaining } from '../utils/formatters';

const DonationCard = ({ donation }) => {
  const donor = donation.donorId || {};
  const donorLabel = donor.organizationName || donor.name || 'Community Donor';
  const imgUrl = resolveImageUrl(donation.image);

  return (
    <article className="card donation-card">
      <div className="donation-card-media">
        {imgUrl ? (
          <img src={imgUrl} alt={donation.foodName} />
        ) : (
          <div className="donation-card-fallback">
            <Utensils size={32} />
            <span>{donation.category}</span>
          </div>
        )}
        <div className="donation-card-badge-top">
          <StatusBadge status={donation.status} />
        </div>
        <span className="donation-card-cat">{donation.category}</span>
      </div>

      <div className="donation-card-body">
        <h3 style={{ fontSize: '1.08rem', fontWeight: 700 }}>{donation.foodName}</h3>

        <div className="donation-meta-list">
          <div className="donation-meta-item">
            <Package size={15} color="var(--forest-mid)" />
            <span>
              <strong>{donation.availableQuantity}</strong> / {donation.quantity} {donation.unit}{' '}
              available
            </span>
          </div>

          <div className="donation-meta-item">
            <Building2 size={15} color="var(--forest-mid)" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {donorLabel}
              {donor.isVerified && (
                <BadgeCheck size={14} color="var(--leaf)" title="Verified Donor" />
              )}
            </span>
          </div>

          <div className="donation-meta-item">
            <MapPin size={15} color="var(--forest-mid)" />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {donation.pickupLocation}
            </span>
          </div>

          <div className="donation-meta-item">
            <Clock size={15} color="var(--orange)" />
            <span style={{ color: 'var(--orange)', fontWeight: 600 }}>
              Pickup: {formatTimeRemaining(donation.pickupDeadline)}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Link
            to={`/donations/${donation._id}`}
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
          >
            View Details <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default DonationCard;
