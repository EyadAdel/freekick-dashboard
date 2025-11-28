// LogoText.jsx
import React from 'react';
import logo from '../../assets/logo.svg'

const LogoText = ({
                      text = "FREE KICK",
                      logoPosition = 6, // Position after 6th character (after "FREE K")
                      className = "",
                      textClassName = "",
                      logoClassName = "h-8 w-8 -mx-1 animate-avatar-float-slowest"
                  }) => {
    const beforeLogo = text.slice(0, logoPosition);
    const afterLogo = text.slice(logoPosition);

    return (
        <div className={`bg-secondary-600 text-white rounded-2xl px-6 py-3 shadow-lg ${className}`}>
      <span className={`text-3xl font-bold tracking-wider flex items-center ${textClassName}`}>
        {beforeLogo}
          <img
              src={logo}
              alt="Logo"
              className={logoClassName}
          />
          {afterLogo}
      </span>
        </div>
    );
};

export default LogoText;