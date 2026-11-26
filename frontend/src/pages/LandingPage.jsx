import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  HeartHandshake,
  UtensilsCrossed,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Leaf,
  Users,
  Sparkles,
  Star,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import DonationCard from '../components/DonationCard';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Publish Surplus Food',
    desc: 'Restaurants, hotels, and caterers list surplus meals with quantity, freshness window, and pickup location in under two minutes.',
    icon: UtensilsCrossed,
  },
  {
    step: '02',
    title: 'NGOs Discover & Request',
    desc: 'Registered NGOs filter nearby food listings by category, quantity, and deadline, then request the exact amount needed.',
    icon: HeartHandshake,
  },
  {
    step: '03',
    title: 'Approve & Collect',
    desc: 'Donors review and approve NGO requests. Safe atomic reservations prevent double-claiming before pickup.',
    icon: Truck,
  },
  {
    step: '04',
    title: 'Verified Completion',
    desc: 'Both parties confirm pickup and completion, updating real-time community impact metrics and trust ratings.',
    icon: CheckCircle2,
  },
];

const LandingPage = () => {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadLandingData = async () => {
      try {
        const [donRes, statsRes, revRes] = await Promise.all([
          api.get('/donations?status=Open&limit=3&sort=deadline'),
          api.get('/stats/public'),
          api.get('/reviews/public'),
        ]);
        if (!active) return;
        setFeatured(donRes.data.data.donations || []);
        setStats(statsRes.data.data.stats || null);
        setTestimonials(revRes.data.data.reviews || []);
      } catch {
        // Keep UI resilient if backend is temporarily offline
      } finally {
        if (active) setLoading(false);
      }
    };
    loadLandingData();
    return () => {
      active = false;
    };
  }, []);

  const donateTarget =
    user?.role === 'donor' ? '/donor/dashboard' : '/register?role=donor';

  return (
    <MainLayout>
      {/* Hero */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="hero-pill">
              <Sparkles size={15} /> Zero-Waste Surplus Food Redistribution
            </div>
            <h1 className="hero-title">
              Turn Surplus Food Into <span>Shared Hope</span> Before It Goes to Waste.
            </h1>
            <p className="hero-subtitle">
              FoodRescue bridges hospitality kitchens, event organizers, and local NGOs with
              real-time donation listings, safe quantity reservations, and transparent pickup
              tracking.
            </p>
            <div className="hero-ctas">
              <Link to={donateTarget} className="btn btn-accent btn-lg">
                Donate Food <ArrowRight size={18} />
              </Link>
              <Link to="/donations" className="btn btn-primary btn-lg">
                Find Food
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="var(--forest-mid)" /> Admin-Verified Partners
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Leaf size={16} color="var(--forest-mid)" /> Live Deadline Tracking
              </span>
            </div>
          </div>

          <div className="hero-visual-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--forest-mid)' }}>
                  LIVE PLATFORM SNAPSHOT
                </div>
                <h3 style={{ fontSize: '1.2rem', marginTop: 4 }}>Community Rescue Pulse</h3>
              </div>
              <span className="status-badge status-available">Active</span>
            </div>

            <div className="grid-2" style={{ gap: 14 }}>
              <div
                style={{
                  background: 'var(--mint-soft)',
                  padding: 16,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--forest)' }}>
                  {stats ? stats.mealsRescued : '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Units Rescued
                </div>
              </div>
              <div
                style={{
                  background: '#fff4ed',
                  padding: 16,
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--orange)' }}>
                  {stats ? stats.activeDonations : '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Open Listings Now
                </div>
              </div>
              <div
                style={{
                  background: 'var(--cream)',
                  padding: 16,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest)' }}>
                  {stats ? stats.totalDonors : '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Food Donors
                </div>
              </div>
              <div
                style={{
                  background: 'var(--cream)',
                  padding: 16,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--forest)' }}>
                  {stats ? stats.totalNgos : '—'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Partner NGOs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Workflow</span>
            <h2 className="section-title">How FoodRescue Works</h2>
            <p className="section-desc">
              A structured, accountable four-step lifecycle that guarantees food safety and
              eliminates duplicate claims.
            </p>
          </div>

          <div className="grid-4">
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="card">
                  <div className="card-body">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <div className="kpi-icon">
                        <Icon size={22} />
                      </div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: 'var(--leaf)',
                        }}
                      >
                        {item.step}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{item.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Available Donations */}
      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 30,
            }}
          >
            <div>
              <span className="section-tag">Live Listings</span>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                Available Surplus Donations
              </h2>
              <p className="section-desc" style={{ margin: 0 }}>
                Fresh surplus food ready for immediate NGO pickup.
              </p>
            </div>
            <Link to="/donations" className="btn btn-outline">
              Explore All Donations <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <LoadingState message="Loading live donations..." />
          ) : featured.length === 0 ? (
            <div className="card card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No active surplus listings right now. Check back soon or publish a donation as a
              Donor!
            </div>
          ) : (
            <div className="grid-3">
              {featured.map((donation) => (
                <DonationCard key={donation._id} donation={donation} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About & Impact */}
      <section id="about" className="section">
        <div className="container grid-2" style={{ alignItems: 'center', gap: 36 }}>
          <div>
            <span className="section-tag">About FoodRescue</span>
            <h2 className="section-title">Built for Safe, Fast &amp; Verifiable Redistribution</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Every day, tons of wholesome prepared meals and packaged ingredients go unserved
              at hotels, restaurants, and events while community shelters face shortages.
              FoodRescue provides a centralized operations hub where donors specify allergen,
              storage, and pickup deadlines, and verified NGOs coordinate timely collection.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Concurrency-safe quantity reservations prevent double-booking',
                'Preparation, use-by, and pickup deadlines enforce food safety',
                'Role-based dashboards for Donors, NGOs, and Platform Admins',
              ].map((point) => (
                <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.93rem' }}>
                  <CheckCircle2 size={18} color="var(--forest-mid)" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="impact" className="card" style={{ background: 'var(--forest)', color: '#fff' }}>
            <div className="card-body" style={{ padding: 30 }}>
              <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em' }}>
                MEASURABLE IMPACT
              </span>
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginTop: 6, marginBottom: 22 }}>
                Real-Time Database Metrics
              </h3>
              <div className="grid-2" style={{ gap: 18 }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                    {stats?.completedDonations ?? 0}
                  </div>
                  <div style={{ color: '#c5ded0', fontSize: '0.86rem' }}>Completed Donations</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                    {stats?.mealsRescued ?? 0}
                  </div>
                  <div style={{ color: '#c5ded0', fontSize: '0.86rem' }}>Servings / Units Saved</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                    {stats?.totalDonors ?? 0}
                  </div>
                  <div style={{ color: '#c5ded0', fontSize: '0.86rem' }}>Registered Donors</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                    {stats?.totalNgos ?? 0}
                  </div>
                  <div style={{ color: '#c5ded0', fontSize: '0.86rem' }}>Registered NGOs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="section"
        style={{ background: 'var(--mint-soft)', borderTop: '1px solid var(--border)' }}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Community Trust</span>
            <h2 className="section-title">Partner Reviews &amp; Stories</h2>
            <p className="section-desc">
              Verified feedback submitted by NGOs and Donors after completed pickups.
            </p>
          </div>

          {testimonials.length === 0 ? (
            <div className="card card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={24} style={{ margin: '0 auto 8px', color: 'var(--forest-mid)' }} />
              Community reviews will appear here as donations are completed and rated.
            </div>
          ) : (
            <div className="grid-3">
              {testimonials.map((rev) => (
                <div key={rev._id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} size={16} color="#f59e0b" fill="#f59e0b" />
                      ))}
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      “{rev.comment}”
                    </p>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--forest)' }}>
                      {rev.reviewerId?.organizationName || rev.reviewerId?.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rev.reviewerId?.role?.toUpperCase()} · {rev.donationId?.foodName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default LandingPage;
