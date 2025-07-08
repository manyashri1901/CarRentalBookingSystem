// App.js


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import FrontPage from './FrontPage';
import Signup from './Signup';
import Contact from './Contact';
import Deals from './Deals';
import Bookings from './Bookings';
import Bookingdetail from './Bookingdetail';
import PaymentPage from './PaymentPage';

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">FrontPage</Link></li>
          <li><Link to="/signup">Signup</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/deals">Deals</Link></li>
          <li><Link to="/bookings">Bookings</Link></li>
          <li><Link to="/booking-detail">Booking Detail</Link></li>
          <li><Link to="/payment"> Payment Page</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Deals" element={<Deals />} />
        <Route path="/Bookings" element={<Bookings />} />
        <Route path="/Booking-detail" element={<Bookingdetail />} />
         <Route path="/payment" element={<PaymentPage />} />
        
       
      </Routes>
    </Router>





  );
}

export default App;
