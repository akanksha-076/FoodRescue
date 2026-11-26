import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="brand-icon">
              <Sprout size={20} />
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>FoodRescue</strong>
          </div>
          <p style={{ color: '#b7d5c5', fontSize: '0.9rem', margin: 0, maxWidth: 320 }}>
            Connecting restaurants, hotels, and event organizers with verified NGOs to rescue
            surplus food and nourish local communities.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.96rem', marginBottom: 12 }}>Platform</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/donations">Browse Donations</Link>
            <Link to="/register">Become a Donor</Link>
            <Link to="/register">Register as NGO</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.96rem', marginBottom: 12 }}>Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#about">Our Mission</a>
            <a href="/#impact">Impact Metrics</a>
            <a href="/#testimonials">Community Stories</a>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.96rem', marginBottom: 12 }}>Contact</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.88rem', color: '#c5ded0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} /> support@foodrescue.org
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={15} /> +91 80 4123 9900
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} /> Civic Impact Hub, Bengaluru
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.84rem',
          color: '#9ec4b0',
        }}
      >
        <span>© {new Date().getFullYear()} FoodRescue Platform. All rights reserved.</span>
        <span>Web Development 3 Capstone Project</span>
      </div>
    </div>
  </footer>
);

export default Footer;
