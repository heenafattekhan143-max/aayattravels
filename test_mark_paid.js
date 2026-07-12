const axios = require('axios');
const API = 'http://127.0.0.1:8000/api';

async function test() {
  try {
    const bill = {
      id: "6a4bf190001d13be14592fc9",
      type: "Sale",
      final_bill_amount: 5500.0,
      customer_id: "",
      customer_name: "Ravi Plan",
      bill_no: "INV-0001"
    };
    
    console.log("Patching...");
    await axios.patch(`${API}/bills/${bill.id}/status`, {
      status: 'Paid',
      paid_amount: parseFloat(bill.final_bill_amount) || 0
    });
    
    console.log("Posting received payment...");
    await axios.post(`${API}/received-payments`, {
      customer_id: bill.customer_id || '',
      customer_name: bill.customer_name || 'Customer',
      amount: parseFloat(bill.final_bill_amount) - (parseFloat(bill.advance_amount) || 0),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'Cash',
      reference_id: bill.bill_no || '',
      notes: `Payment for Bill: ${bill.bill_no}`
    });
    
    console.log("Success!");
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
