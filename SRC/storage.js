const DB='fleetledger-v3-source-verified',STORE='monthly-files';
function open(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(new Error('This browser does not support local database storage.'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Local database could not be opened. Check browser storage permissions.'))})}
async function transaction(mode,fn){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),s=tx.objectStore(STORE),req=fn(s);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(new Error('Local storage operation failed.'));tx.onabort=()=>reject(new Error('Local storage transaction aborted.'))})}finally{db.close()}}
export const getAll=()=>transaction('readonly',s=>s.getAll());
export const save=(data)=>transaction('readwrite',s=>s.put(data));
export const remove=(id)=>transaction('readwrite',s=>s.delete(id));
