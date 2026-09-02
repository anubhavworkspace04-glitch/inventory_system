export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-IN', options);
};

export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-IN', options);
};

export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';
  // Already an absolute URL (e.g. Unsplash placeholder or Cloudinary URL) - return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Relative path like /uploads/variants/xxx.png
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    try {
      const origin = new URL(apiUrl).origin;
      return `${origin}${cleanPath}`;
    } catch (e) {
      return cleanPath;
    }
  }
  return cleanPath;
};

/**
 * Dynamically generates corporate initials from company name.
 * Examples:
 *  "GG Glassware Co." -> "GG"
 *  "Anubhav Pratap" -> "AP"
 *  "ABC Enterprises" -> "AE"
 *  "Raj Kumar Glass Works" -> "RK"
 *  "Glassware Company" -> "GC"
 *  "Anubhav" -> "A"
 */
export const getCompanyInitials = (companyName?: string | null): string => {
  if (!companyName || !companyName.trim()) {
    return 'GG';
  }

  // Remove common punctuation marks
  const cleanName = companyName.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  const words = cleanName.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return 'GG';

  if (words.length === 1) {
    return words[0].substring(0, 1).toUpperCase();
  }

  // First letter of first 2 words
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Dynamically generates user initials from user full name.
 * Examples:
 *  "Anubhav Pratap Singh" -> "AP"
 *  "Rahul Kumar" -> "RK"
 *  "Admin" -> "A"
 */
export const getUserInitials = (userName?: string | null): string => {
  if (!userName || !userName.trim()) {
    return 'U';
  }

  const cleanName = userName.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  const words = cleanName.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return 'U';

  if (words.length === 1) {
    return words[0].substring(0, 1).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
};
