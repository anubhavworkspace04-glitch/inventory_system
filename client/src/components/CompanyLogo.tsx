import React, { useState } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getImageUrl, getCompanyInitials } from '../utils';

interface CompanyLogoProps {
  className?: string; // Container className e.g. "h-8 w-8 rounded-lg"
  imageClassName?: string;
  textClassName?: string;
  altText?: string;
  fallbackName?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = 'h-8 w-8 rounded-lg',
  imageClassName = 'object-contain rounded-lg',
  textClassName = 'font-bold text-sm text-white',
  altText,
  fallbackName
}) => {
  const { settings, isLoading } = useInventoryStore();
  const [imageError, setImageError] = useState(false);

  const companyName = fallbackName || settings?.businessName || 'GG Glassware Co.';
  const logoUrl = settings?.logo;
  const initials = getCompanyInitials(companyName);

  // STATE 1: LOADING
  if (isLoading && !settings) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className} flex items-center justify-center shrink-0`}>
        <span className="sr-only">Loading logo...</span>
      </div>
    );
  }

  // STATE 2: VALID LOGO URL & NO LOAD ERROR
  if (logoUrl && !imageError) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
        <img
          src={getImageUrl(logoUrl)}
          alt={altText || companyName}
          className={`w-full h-full ${imageClassName}`}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // STATE 3 & 4: LOGO MISSING OR IMAGE LOAD ERROR -> DYNAMIC INITIALS FALLBACK
  return (
    <div className={`flex items-center justify-center bg-brand-500 border border-brand-600 shadow-sm shrink-0 ${className}`}>
      <span className={textClassName}>{initials}</span>
    </div>
  );
};
