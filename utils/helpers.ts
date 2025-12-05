
export const formatDateVN = (isoDateString: string): string => {
  if (!isoDateString) return '';
  try {
    // If it's already in standard format (simple check), just return
    if (isoDateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return isoDateString;

    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;
    
    // Explicitly format as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return isoDateString;
  }
};

export const formatDateTimeVN = (isoDateString: string): string => {
   if (!isoDateString) return '';
   const date = new Date(isoDateString);
   if (isNaN(date.getTime())) return isoDateString;
   return new Intl.DateTimeFormat('vi-VN', {
     day: '2-digit', month: '2-digit', year: 'numeric',
     hour: '2-digit', minute: '2-digit'
   }).format(date);
};

export const formatCurrencyVN = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatNumberInput = (value: number | string): string => {
  if (!value && value !== 0) return '';
  // Remove non-digits
  const cleanVal = String(value).replace(/\D/g, '');
  // Format with dots for thousands
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  // Remove dots to parse back to number
  return Number(String(value).replace(/\./g, ''));
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour12: false });
};
