
export const formatDateVN = (isoDateString: string): string => {
  if (!isoDateString) return '';
  try {
    const [year, month, day] = isoDateString.split('-');
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
  if (!value) return '';
  // Remove non-digits
  const cleanVal = String(value).replace(/\D/g, '');
  // Format with dots
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumberInput = (value: string): number => {
  return Number(value.replace(/\./g, ''));
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour12: false });
};
