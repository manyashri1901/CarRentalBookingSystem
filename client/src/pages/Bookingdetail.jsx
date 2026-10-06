import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../api";
import BookingForm from "../components/BookingForm";
import "../styles/CarDetail.css";
import "../styles/Bookingdetail.css";

// Booking Details: pick any EV from the live fleet and book it.
// /booking-detail?car=tata-nexon-ev preselects a car.
const Bookingdetail = () => {
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useApi("/api/cars", { sort: "price_asc" });
  const cars = data?.cars || [];

  return (
    <main className="page narrow booking-details-container">
      <h1>📝 Booking Details</h1>
      <p className="muted center">
        Choose your EV and trip details. Prefer to compare first? <Link to="/cars">Browse all EVs</Link>.
      </p>

      <div className="card booking-form-card">
        {loading && !data && <p className="muted" aria-busy="true">Loading cars…</p>}

        {error && !data && (
          <div className="state-box" role="alert">
            <p className="muted">{error.message}</p>
            <button type="button" className="btn" onClick={reload}>Try again</button>
          </div>
        )}

        {data && <BookingForm cars={cars} initialCarId={params.get("car") || ""} />}
      </div>
    </main>
  );
};

export default Bookingdetail;
