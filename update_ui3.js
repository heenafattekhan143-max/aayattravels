const fs = require('fs');
const file = './src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

const categories = ['business', 'billing', 'vehicle', 'driver', 'plans', 'company', 'booking'];
categories.forEach(cat => {
  const searchStr = "className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-xl ${submenuOpen." + cat + " ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}";
  const replaceStr = "className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-xl ${submenuOpen." + cat + " ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}`}";
  code = code.replace(searchStr, replaceStr);
});

fs.writeFileSync(file, code);
console.log("Updated App.jsx successfully!");
