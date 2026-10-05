import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Payment.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [qrSrc, setQrSrc] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const [formData, setFormData] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [showPopup, setShowPopup] = useState(false);

  const loadQRCode = () => {
    const timestamp = new Date().getTime();
    setQrFailed(false);
    setQrSrc(`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsQh8X389XL5cnKAdFfN6BE-vyEm1C3G_zJw&s&t=${timestamp}`);
  };

  useEffect(() => {
    loadQRCode();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePayNow = (e) => {
    e.preventDefault();
    setShowPopup(true);
    setFormData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  };

  return (
    <main className="page payment-page">
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="payment-wrap">
        <div className="section-header">
          <h1>Payment Options</h1>
          {state?.carName && (
            <p className="muted">
              {state.carName} — ₹{(state.amount / 100).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <div className="payment-options">
          {/* QR Code Section */}
          <section className="payment-card">
            <h2>📱 QR Scan Payment</h2>
            <div className="qr-code">
              {qrFailed ? (
                <p className="muted">QR code unavailable. Try refreshing.</p>
              ) : (
                <img src={qrSrc} alt="Payment QR code" onError={() => setQrFailed(true)} />
              )}
            </div>
            <div className="qr-instructions">
              <p>Scan this QR code with your payment app to pay instantly.</p>
              <p>Supports UPI, Paytm, PhonePe, Google Pay and more.</p>
            </div>
            <button type="button" className="btn btn-block" onClick={loadQRCode}>Refresh QR Code</button>
          </section>

          {/* Card Payment Section */}
          <section className="payment-card">
            <h2>💳 Card Payment</h2>
            <form className="card-form" onSubmit={handlePayNow}>
              <div className="input-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input type="text" id="cardNumber" value={formData.cardNumber} onChange={handleInputChange}
                  placeholder="XXXX XXXX XXXX XXXX" inputMode="numeric" autoComplete="cc-number"
                  maxLength={19} required />
              </div>

              <div className="input-group">
                <label htmlFor="cardName">Cardholder Name</label>
                <input type="text" id="cardName" value={formData.cardName} onChange={handleInputChange}
                  placeholder="Name on card" autoComplete="cc-name" required />
              </div>

              <div className="expiry-cvv">
                <div className="input-group">
                  <label htmlFor="expiry">Expiry Date</label>
                  <input type="text" id="expiry" value={formData.expiry} onChange={handleInputChange}
                    placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" maxLength={5} required />
                </div>
                <div className="input-group">
                  <label htmlFor="cvv">CVV</label>
                  <input type="password" id="cvv" value={formData.cvv} onChange={handleInputChange}
                    placeholder="XXX" inputMode="numeric" autoComplete="cc-csc" maxLength={4} required />
                </div>
              </div>

              <button type="submit" className="btn btn-block">Pay Now</button>

              <div className="card-icons">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" width="40" height="14" loading="lazy" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width="40" height="24" loading="lazy" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="American Express" width="40" height="40" loading="lazy" />
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="popup" onClick={() => setShowPopup(false)}>
          <div className="popup-content" role="dialog" aria-modal="true" aria-label="Payment status"
            onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-button" aria-label="Close" onClick={() => setShowPopup(false)}>
              &times;
            </button>
            <p className="popup-message">Payment Successful!</p>
            <div className="popup-check" aria-hidden="true">✓</div>
            <p>Your transaction has been completed successfully.</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default PaymentPage;
