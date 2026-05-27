// src/components/Skeleton/AppointmentDetailsSkeleton.jsx
import React from "react";
import "../../styles/AppointmentDetails.css";

const AppointmentDetailsSkeleton = () => {
  return (
    <div className="appointment-details-page">
      {/* Header */}
      <div className="skeleton-header">
        <div className="skeleton skeleton-back"></div>
        <div className="skeleton skeleton-status"></div>
      </div>

      {/* Detail Grid */}
      <div className="skeleton-details-grid">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div className="skeleton-detail" key={idx}>
            <div className="skeleton skeleton-icon"></div>
            <div>
              <div className="skeleton skeleton-text-sm"></div>
              <div className="skeleton skeleton-text-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      {["Diagnosis", "History", "Documents", "Prescription", "Tests", "FollowUp"].map((section, idx) => (
        <div className="skeleton-section" key={idx}>
          <div className="skeleton skeleton-label"></div>
          <div className="skeleton skeleton-paragraph"></div>
        </div>
      ))}

      {/* Documents list simulation */}
      <div className="skeleton-section">
        <div className="skeleton skeleton-label"></div>
        {Array.from({ length: 2 }).map((_, idx) => (
          <div className="skeleton-file skeleton" key={idx}></div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentDetailsSkeleton;
