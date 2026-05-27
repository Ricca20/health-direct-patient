// src/components/DashboardSkeleton.jsx
import React from "react";
import "../../styles/Dashboard.css";

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-grid">
      {/* Mobile discount */}
      <div className="discount-card-mobile">
        <div className="skeleton-box skeleton-discount-mobile"></div>
      </div>

      {/* Profile */}
      <div className="skeleton-box skeleton-profile"></div>

      {/* Payments */}
      <div className="skeleton-box skeleton-payments"></div>

      {/* Desktop discount */}
      <div className="discount-card-desktop">
        <div className="skeleton-box skeleton-discount-desktop"></div>
      </div>

      {/* Appointments */}
      <div className="skeleton-box skeleton-appointments"></div>

      {/* Services */}
      <div className="skeleton-box skeleton-services"></div>
    </div>
  );
};

export default DashboardSkeleton;
