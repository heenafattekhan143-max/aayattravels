const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We want to replace "Customer" with "Client", but not in variables like "customer_id".
      // We will look for instances of "Customer" (capital C) and replace with "Client",
      // and "Customers" with "Clients".
      
      // Only replace exact words starting with capital C to avoid breaking things, 
      // but wait, AddCustomer, CustomerList components might get renamed if we are not careful.
      // We only want to replace UI labels, so let's use regex that targets strings and JSX text.
      
      // Let's just do a naive replacement of the exact word "Customer" and "Customers"
      // because variable names are typically camelCase (customer, customerName) or snake_case (customer_id).
      // Capital "Customer" is used in component names (CustomerList), which is fine to change if we also rename the file,
      // BUT we don't want to rename files! We only want to change UI text.
      
      // Safest way: replace "Customer" with "Client" only if it's inside quotes or tags
      // Or we can just replace 'Customer' -> 'Client' and 'Customers' -> 'Clients' 
      // as long as it's not part of an import statement or component name.
      
      // Let's just replace all occurrences of the WORD "Customer" and "Customers" in the UI visible parts.
      // Wait, there's `AddCustomer`, `CustomerList` component names. 
      // We shouldn't change component names or import paths to avoid breaking the build.
    }
  }
}
