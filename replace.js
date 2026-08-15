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
      let originalContent = content;
      
      // Replace instances of "Customer" -> "Client" and "Customers" -> "Clients"
      // But only in places where it's likely a UI label:
      // - Inside JSX text (e.g. >Customer< or > Customer <)
      // - Inside quotes (e.g. "Customer", 'Customer')
      // - Preceded/followed by space (e.g. "Add Customer")
      
      // We will look for regex: /(>|\s|'|"|`)Customer(s?)(<|\s|'|"|`|,|\.)/g
      // Wait, this could break if we have something like import AddCustomer from './AddCustomer' -> 'AddCustomer' has no space.
      // But "Add Customer" will match.
      
      content = content.replace(/(>|\s|'|"|`)Customer(s?)(<|\s|'|"|`|,|\.|!|:)/g, (match, p1, p2, p3) => {
        return p1 + "Client" + (p2 === 's' ? 's' : '') + p3;
      });
      
      // Some special cases like `CustomerName` -> `ClientName`? No, variables should stay the same to avoid DB breaks.
      // What about `Customer` at the start of a JSX string like `Customer Details`? `\s` captures it if there is a space before.
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
