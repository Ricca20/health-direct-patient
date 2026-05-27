// src/components/Skeleton/AppointmentsSkeleton.jsx
import React from "react";
import "../../styles/Appointments.css";

const SkeletonCard = () => (
  <div className="skeleton-card">
    {/* Top row: title + status */}
    <div className="skeleton-card-top">
      <div className="skeleton-title"></div>
      <div className="skeleton-status"></div>
    </div>

    {/* Middle lines */}
    <div className="skeleton-line"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line" style={{ width: "60%" }}></div>

    {/* Bottom row: last line + button */}
    <div className="skeleton-card-bottom">
      <div className="skeleton-line" style={{ width: "40%" }}></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

const AppointmentsSkeleton = ({ viewMode }) => {
  if (viewMode === "grid") {
    return (
      <div className="appointments-grid">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="appointments-list">
      {Array.from({ length: 8 }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

export default AppointmentsSkeleton;
