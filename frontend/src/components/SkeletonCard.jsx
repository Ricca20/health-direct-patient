// src/components/DashboardSkeleton.jsx
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-grid">
      <div className="discount-card-mobile">
        <Skeleton height={120} borderRadius={12} />
      </div>

      {/* Profile Card (taller) */}
      <Skeleton height={200} borderRadius={12} />

      {/* Payments Card (medium height) */}
      <Skeleton height={160} borderRadius={12} />

      <div className="discount-card-desktop">
        <Skeleton height={120} borderRadius={12} />
      </div>

      {/* Appointments Card (taller) */}
      <Skeleton height={220} borderRadius={12} />

      {/* Services Card (medium) */}
      <Skeleton height={180} borderRadius={12} />
    </div>
  );
};

export default DashboardSkeleton;
