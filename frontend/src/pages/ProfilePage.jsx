import MainLayout from '../layouts/MainLayout';
import ProfileSection from '../components/ProfileSection';

const ProfilePage = () => (
  <MainLayout>
    <div className="container" style={{ padding: '40px 20px', maxWidth: 820 }}>
      <ProfileSection />
    </div>
  </MainLayout>
);

export default ProfilePage;
