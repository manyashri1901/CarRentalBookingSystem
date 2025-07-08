import React, { useEffect, useState } from 'react';
import './Signup.css';

const backgroundImages = [
  "https://www.rbtsselfdrive.com/images/IMG_0362.JPG",
  "https://punjabrentcars.com/wp-content/uploads/2024/09/about-page-scaled.jpg",
  "https://royaldrivecar.com/wp-content/uploads/2024/12/self-drive-car-rental-service-Royal-drive-car.png"
];

const SignupPage = () => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [buttonState, setButtonState] = useState('default');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      document.body.style.scrollBehavior = window.innerWidth <= 768 ? 'smooth' : 'auto';
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setButtonState('loading');
    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => setButtonState('default'), 2000);
    }, 1500);
  };

  const getButtonClass = () => {
    return `submit-btn ${buttonState}`;
  };

  return (
    <div className="container">
      <div
        className="brand-section fade-in"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${backgroundImages[currentBgIndex]})`
        }}
      >
        <div className="brand-content">
          <h1 className="brand-logo">SELF DRIVE CARS</h1>
          <p className="brand-tagline">Freedom, Comfort, and Luxury – Drive Your Dream</p>
          <ul className="features-list">
            <li>Premium car selection</li>
            <li>Instant confirmations</li>
            <li>24/7 support</li>
            <li>Flexible durations</li>
            <li>Full insurance cover</li>
          </ul>
        </div>
      </div>

      <div className="form-section">
        <div className="form-header">
          <h2>Get Started</h2>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label>First Name*</label>
            <input type="text" className="form-control" placeholder="Your First Name" required />
          </div>
          <div className="form-group">
            <label>Last Name*</label>
            <input type="text" className="form-control" placeholder="Your Last Name" required />
          </div>
          <div className="form-group">
            <label>Email*</label>
            <input type="email" className="form-control" placeholder="example@mail.com" required />
          </div>
          <div className="form-group">
            <label>Password*</label>
            <input type="password" className="form-control" placeholder="Create a password" required />
          </div>

          <button type="submit" className={getButtonClass()}>
            {buttonState === 'loading' ? 'Creating Account...' : buttonState === 'success' ? '✓ Account Created!' : 'Create Account'}
          </button>

          <p className="terms-text">
            By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </form>

        <div className="social-divider"><span>or sign up with</span></div>
        <div className="social-buttons">
          <a href="https://your-backend.com/auth/google" className="social-btn google">
            <span className="icon google-icon"></span>
            Google
          </a>
          <a href="https://your-backend.com/auth/facebook" className="social-btn facebook">
            <span className="icon facebook-icon"></span>
            Facebook
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
