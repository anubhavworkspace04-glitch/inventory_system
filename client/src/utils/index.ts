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
  // Already an absolute URL (e.g. Unsplash placeholder) - return as-is
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

