// src/components/BannerSlider.jsx
import React, { useState, useCallback } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { fallbackImages } from '../../utils/fallbackImages';

const BannerSlider = ({
                          banners,
                          autoPlay = true,
                          speed = 3000,
                          slidesToShow = 1,
                          slidesToScroll = 1,
                          infinite = true,
                          dots = true,
                          arrows = true,
                          onBannerClick,
                      }) => {
    const [loadedImages, setLoadedImages] = useState({});
    const [errorImages, setErrorImages] = useState({});

    const settings = {
        dots,
        infinite,
        speed: 500,
        slidesToShow,
        slidesToScroll,
        autoplay: autoPlay,
        autoplaySpeed: speed,
        arrows,
        pauseOnHover: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(2, slidesToShow),
                    slidesToScroll: Math.min(2, slidesToScroll),
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    const handleImageError = useCallback((id) => {
        setErrorImages(prev => ({ ...prev, [id]: true }));
    }, []);

    const handleImageLoad = useCallback((id) => {
        setLoadedImages(prev => ({ ...prev, [id]: true }));
    }, []);

    if (!banners || banners.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No banners available</p>
            </div>
        );
    }

    const activeBanners = banners.filter(banner => banner.is_active);

    if (activeBanners.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No active banners available</p>
            </div>
        );
    }

    return (
        <div className="banner-slider">
            <Slider {...settings}>
                {activeBanners.map((banner) => {
                    const imageSrc = errorImages[banner.id]
                        ? fallbackImages.large
                        : banner.image || fallbackImages.large;

                    return (
                        <div key={banner.id} className="px-2">
                            <div
                                className="relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                                onClick={() => onBannerClick?.(banner)}
                            >
                                {!loadedImages[banner.id] && !errorImages[banner.id] && (
                                    <div className="w-full h-64 md:h-[60vh] bg-gray-200 animate-pulse rounded-lg"></div>
                                )}
                                <img
                                    src={imageSrc}
                                    alt={`Banner ${banner.id}`}
                                    className={`w-full h-64 md:h-[60vh] object-cover ${!loadedImages[banner.id] && !errorImages[banner.id] ? 'hidden' : 'block'}`}
                                    onError={() => handleImageError(banner.id)}
                                    onLoad={() => handleImageLoad(banner.id)}
                                    loading="lazy"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                    <div className="flex justify-between items-center">
                    <span className="text-white text-sm bg-blue-600 px-2 py-1 rounded">
                      {banner.type}
                    </span>
                                        <span className="text-white text-sm">
                      {new Date(banner.created_at).toLocaleDateString()}
                    </span>
                                    </div>
                                    {banner.value && (
                                        <p className="text-white mt-2 truncate">{banner.value}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </Slider>
        </div>
    );
};

export default BannerSlider;