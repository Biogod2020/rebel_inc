const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context=vm.createContext({console});vm.runInContext(fs.readFileSync(path.join(__dirname,'../build/core.js'),'utf8'),context);
module.exports=context.Afterfire;
