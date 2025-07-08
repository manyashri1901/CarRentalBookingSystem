import React, { useEffect, useState } from 'react';
import './Payment.css';

const PaymentPage = () => {
  const [qrSrc, setQrSrc] = useState('');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [showPopup, setShowPopup] = useState(false);

  const loadQRCode = () => {
    const timestamp = new Date().getTime();
    const qrImageUrl = `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsQh8X389XL5cnKAdFfN6BE-vyEm1C3G_zJw&s&t=${timestamp}`;
    setQrSrc(qrImageUrl);
  };

  useEffect(() => {
    loadQRCode();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePayNow = () => {
    const { cardNumber, cardName, expiry, cvv } = formData;

    if (!cardNumber || !cardName || !expiry || !cvv) {
      alert('Please fill in all card details');
      return;
    }

    setShowPopup(true);
    setFormData({
      cardNumber: '',
      cardName: '',
      expiry: '',
      cvv: ''
    });
  };

  return (
    <>
      <button className="back-button" onClick={() => window.history.back()}>
        Back
      </button>

      <div className="container">
        <div className="section-header">
          <div className="icon-circle">
            <i className="fas fa-credit-card"></i>
          </div>
          <h2>Payment Options</h2>
        </div>

        <div className="payment-options">
          {/* QR Code Section */}
          <div className="payment-card">
            <h3><i className="fas fa-mobile-alt"></i> QR Scan Payment</h3>
            <div className="qr-code">
              <img src={qrSrc} alt="QR Code" />
            </div>
            <div className="qr-instructions">
              <p>Scan this QR code with your payment app to pay instantly</p>
              <p>Supports UPI, Paytm, PhonePe, Google Pay and more</p>
            </div>
            <button className="pay-button" onClick={loadQRCode}>Refresh QR Code</button>
          </div>

          {/* Card Payment Section */}
          <div className="payment-card">
            <h3><i className="far fa-credit-card"></i> Card Payment</h3>
            <div className="card-form">
              <div className="input-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="XXXX XXXX XXXX XXXX"
                />
              </div>

              <div className="input-group">
                <label htmlFor="cardName">Cardholder Name</label>
                <input
                  type="text"
                  id="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="Name on card"
                />
              </div>

              <div className="expiry-cvv">
                <div className="input-group">
                  <label htmlFor="expiry">Expiry Date</label>
                  <input
                    type="text"
                    id="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="XXX"
                  />
                </div>
              </div>

              <button className="pay-button" onClick={handlePayNow}>
                Pay Now
              </button>

              <div className="card-icons">
                <div className="card-icon">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" width="30" />
                </div>
                <div className="card-icon">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width="30" />
                </div>
                <div className="card-icon">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" width="30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="popup" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setShowPopup(false)}>&times;</span>
            <p className="popup-message">Payment Successful!</p>
            <i className="fas fa-check-circle" style={{ fontSize: 50, color: '#1a7f1a', margin: '15px 0' }}></i>
            <p>Your transaction has been completed successfully.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPage;
