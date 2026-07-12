const fs = require('fs');
const file = './src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const categories = ['business', 'billing', 'vehicle', 'driver', 'plans', 'company', 'booking'];
categories.forEach(cat => {
  const searchStr = `onClick={() => toggleSubmenu('${cat}')}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition"`;
  
  const replaceStr = `onClick={() => toggleSubmenu('${cat}')}
              className={\`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-xl \${submenuOpen.${cat} ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}\`}`;
              
  code = code.replace(searchStr, replaceStr);
});

const pages = [
  'all-sale', 'purchase', 'my-sale', 
  'add-gst', 'generate-bill', 'bill-list',
  'add-vehicle', 'vehicle-maintenance', 'vehicle-list',
  'add-driver', 'driver-list', 'driver-salary',
  'add-plan', 'plan-list',
  'add-customer', 'customer-list',
  'booking-screen'
];

pages.forEach(page => {
  const regexStr = "className=\\{`w-full flex items-center gap-2\\.5 px-3 py-2 rounded-lg text-xs font-semibold transition \\$\\{currentPage === '" + page + "' \\? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'\\s*}\\`\\}";
  const searchRegex = new RegExp(regexStr, 'g');
  const replaceStr = `className={\`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition \${currentPage === '${page}' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}\`}`;
  code = code.replace(searchRegex, replaceStr);
});

fs.writeFileSync(file, code);
console.log("Updated App.jsx successfully!");
