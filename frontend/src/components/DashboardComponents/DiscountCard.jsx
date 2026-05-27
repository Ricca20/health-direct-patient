import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css/pagination";
import "swiper/css";
import "swiper/css/effect-fade";
import "../../styles/DiscountCard.css";
import { getPromos } from "../../utils/api";

const DiscountCard = () => {
  const { t } = useTranslation();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);
  const videoRefs = useRef({}); 

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await getPromos();
        if (response.data && Array.isArray(response.data.promos)) {
          setPromos(response.data.promos);
        } else {
          setPromos([]);
        }
      } catch (error) {
        setError("Failed to load promos");
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  // Reset video playback state
  const resetVideo = (video) => {
    if (video) {
      video.currentTime = 0; // Reset to start
      video.pause(); // Ensure paused
    }
  };

  // Handle slide change
  const handleSlideChange = (swiper) => {
    const activeIndex = swiper.realIndex;
    const activePromo = promos[activeIndex];

    // Pause all videos
    Object.values(videoRefs.current).forEach((video) => resetVideo(video));

    if (activePromo && activePromo.fileType === "video") {
      swiper.autoplay.stop(); // Pause Swiper autoplay
      const video = videoRefs.current[activeIndex];
      if (video) {
        video.play().catch((e) => console.error("Video play error:", e));
      }
    } else {
      swiper.autoplay.start(); // Resume Swiper autoplay for non-video slides
    }
  };

  // Handle video end
  const handleVideoEnd = (swiper, index) => {
    resetVideo(videoRefs.current[index]); // Reset video state
    swiper.autoplay.start(); // Resume Swiper autoplay
    swiper.slideNext(); // Move to next slide
  };

  // Handle slide transition end to ensure correct video playback
  const handleTransitionEnd = (swiper) => {
    const activeIndex = swiper.realIndex;
    const activePromo = promos[activeIndex];
    if (activePromo && activePromo.fileType === "video") {
      const video = videoRefs.current[activeIndex];
      if (video && video.paused) {
        video.play().catch((e) => console.error("Video play error:", e));
      }
    }
  };

if (loading) {
  return <div className="skeleton-loader"></div>;
}


  if (error) {
    return (
      <div className="discounts-card" style={{ height: "14rem" }}>
        {error}
      </div>
    );
  }

  return (
    <Swiper
      modules={[Autoplay, EffectFade, Pagination]}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop={promos.length > 1}
      pagination={{
        clickable: true,
        dynamicBullets: false,
      }}
      className="discounts-swiper"
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      onSlideChange={handleSlideChange}
      onTransitionEnd={handleTransitionEnd}
    >
      {promos.length > 0 ? (
        promos.map((promo, index) => (
          <SwiperSlide key={promo._id}>
            {promo.fileType === "image" || promo.fileType === "gif" ? (
              <img
                src={`data:${
                  promo.fileType === "gif" ? "image/gif" : "image/jpeg"
                };base64,${promo.fileData}`}
                alt={promo.filename}
                className="discounts-full-image"
                onError={(e) => console.error("Image load error:", e)}
              />
            ) : promo.fileType === "video" ? (
              <video
                ref={(el) => (videoRefs.current[index] = el)} // Store video ref
                src={`data:video/mp4;base64,${promo.fileData}`}
                muted
                className="discounts-full-image"
                onError={(e) => console.error("Video load error:", e)}
                onEnded={() => handleVideoEnd(swiperRef.current, index)}
              />
            ) : (
              <div style={{ display: "none" }}>Invalid file type</div>
            )}
          </SwiperSlide>
        ))
      ) : (
        <SwiperSlide>
          <div className="discounts-card">
            <div className="discounts-card-inner">
              <h3
                className="discounts-title"
                dangerouslySetInnerHTML={{ __html: t("discounts_card.text") }}
              />
              <div className="discounts-button-wrapper">
                <button className="discounts-button">
                  {t("discounts_card.button")}
                </button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      )}
    </Swiper>
  );
};

export default DiscountCard;
