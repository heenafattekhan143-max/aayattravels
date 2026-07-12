export function convertNumberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  
  // Truncate decimals or handle them
  const amount = Math.round(num);
  if (amount === 0) return "Rupees Zero Only";
  
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanThousand(n) {
    let str = "";
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      str += doubleDigits[n - 10] + " ";
    } else if (n >= 20) {
      str += tensMultiple[Math.floor(n / 10)] + " ";
      n %= 10;
      if (n > 0) {
        str += singleDigits[n] + " ";
      }
    } else if (n > 0) {
      str += singleDigits[n] + " ";
    }
    return str;
  }
  
  let temp = amount;
  let words = "";
  
  // Crores
  if (temp >= 10000000) {
    words += convertLessThanThousand(Math.floor(temp / 10000000)) + "Crore ";
    temp %= 10000000;
  }
  
  // Lakhs
  if (temp >= 100000) {
    words += convertLessThanThousand(Math.floor(temp / 100000)) + "Lakh ";
    temp %= 100000;
  }
  
  // Thousands
  if (temp >= 1000) {
    words += convertLessThanThousand(Math.floor(temp / 1000)) + "Thousand ";
    temp %= 1000;
  }
  
  // Hundreds & Tens
  if (temp > 0) {
    words += convertLessThanThousand(temp);
  }
  
  // Clean up whitespace
  const cleanWords = words.trim().replace(/\s+/g, ' ');
  return `(Rs. ${cleanWords} Only)`;
}
