// src/components/Skeleton/ProfileSkeleton.jsx
import React from "react";
import "../../styles/Profile.css";

const ProfileSkeleton = () => {
  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        {/* Photo Section */}
        <div className="photo-section">
          <div className="skeleton skeleton-photo-cirecle"></div>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <div className="skeleton skeleton-title"></div>

          <div className="form-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="skeleton skeleton-input"></div>
            ))}
            <div className="skeleton skeleton-textarea"></div>
          </div>

          <div className="skeleton skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
