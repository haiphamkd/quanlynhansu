
export const formatDateVN = (isoDateString: string): string => {
  if (!isoDateString) return '';
  
  // Check if already in dd/mm/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDateString)) return isoDateString;

  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;
    
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
   
   const day = date.getDate().toString().padStart(2, '0');
   const month = (date.getMonth() + 1).toString().padStart(2, '0');
   const year = date.getFullYear();
   const hours = date.getHours().toString().padStart(2, '0');
   const minutes = date.getMinutes().toString().padStart(2, '0');

   return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatCurrencyVN = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatNumberInput = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return '';
  // Remove non-digits
  const cleanVal = String(value).replace(/\D/g, '');
  // Format with dots for thousands (standard Vietnamese format)
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

export const removeVietnameseTones = (str: string): string => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|U|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // \u0300, \u0301, \u0303, \u0309, \u0323
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  str = str.replace(/ + /g, " ");
  str = str.trim();
  // Remove punctuations
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
  return str;
};

export const generateUsername = (fullName: string): string => {
  const noTone = removeVietnameseTones(fullName.toLowerCase());
  const parts = noTone.split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0)).join('');
  
  return `${lastName}${initials}`;
};