import * as XLSX from 'xlsx';
import {money,normalizePlate,plateKey,categoryFor} from './logic';
const clean=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const fields={plate:['platenumber','licenseplate','licenceplate','bikenumber','bikeplate','plate','vehicleplate'],authority:['finessource','fineauthority','authority','issuer','department'],date:['ticketdate','tripdate','transactiondate','date'],reference:['ticketnumber','transactionid','reference','tripid']};
const find=(headers,keys)=>{for(const k of keys){const i=headers.findIndex(h=>clean(h)===k);if(i!==-1)return i}return -1};
// The supplied EWDS exports use numeric plate identifiers. Textual summary labels,
// such as "TotalAmount (AED):", must never become vehicle identifiers.
export const validVehiclePlate=v=>/^\d{4,8}$/.test(String(v??'').trim().replace(/\s+/g,''));
export function extractAutomatic(buffer,filename,type,month){
 let wb;try{wb=XLSX.read(buffer,{type:'array',cellDates:false})}catch{throw Error('Unable to read spreadsheet: use valid XLS, XLSX or CSV.')}
 const candidates=[];
 for(const name of wb.SheetNames){let rows;try{rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false,blankrows:false})}catch{continue}
 for(let i=0;i<Math.min(rows.length,100);i++){
 const headers=rows[i].map(String),plate=find(headers,fields.plate);
 const amount=find(headers,type==='salik'?['totalamountaedinclvat','totalamountinclvat','totalamountaed','totalamount','amountaed','amount']:['ticketfee','fineamount','amount']);
 if(plate<0||amount<0)continue;
 const authority=find(headers,fields.authority),date=find(headers,fields.date),reference=find(headers,fields.reference);
 if(type==='traffic'&&authority<0)continue;
 const valid=rows.slice(i+1).filter(r=>validVehiclePlate(r[plate])&&money(r[amount])!==null).length;
 if(valid<1)continue;
 candidates.push({name,rows,i,plate,amount,authority,date,reference,headers,valid,score:valid*100+(type==='salik'&&clean(headers[amount])==='totalamountaedinclvat'?50:0)+(type==='traffic'&&clean(headers[amount])==='ticketfee'?50:0)});
 }}
 if(!candidates.length)throw Error(`Cannot locate a valid ${type} transaction table in ${filename}. No records imported.`);
 candidates.sort((a,b)=>b.score-a.score);const c=candidates[0],records=[],issues=[],seen=new Set();let skipped=0;
 for(let i=c.i+1;i<c.rows.length;i++){
 const row=c.rows[i],rawPlate=row[c.plate],amount=money(row[c.amount]);
 if(!validVehiclePlate(rawPlate)||amount===null){if(row.some(x=>String(x??'').trim()))skipped++;continue}
 const plate=normalizePlate(rawPlate),key=plateKey(plate);
 const authority=c.authority<0?'':String(row[c.authority]??'');
 // "Salik" in the traffic-fines export denotes a violation, not a toll trip.
 const category=type==='salik'?'salik':authority.trim()||'UNSPECIFIED AUTHORITY';
 const reference=c.reference<0?'':String(row[c.reference]??'').trim(),date=c.date<0?'':String(row[c.date]??'').trim();
 const unique=reference?`${type}|${key}|${reference}`:null;
 if(unique&&seen.has(unique)){issues.push(`Repeated transaction ID skipped: ${reference} (source row ${i+1})`);continue}
 if(unique)seen.add(unique);
 if(type==='traffic'&&!authority.trim())issues.push(`Plate ${plate}, row ${i+1}: missing fine authority; grouped as UNSPECIFIED AUTHORITY`);
 records.push({key,plate,amount,category,date,reference,authority,source:type,filename,month,row:i+1});
 }
 if(!records.length)throw Error(`No valid ${type} transactions found in ${filename}.`);
 return {records,issues,skipped,mapping:`${c.name}, header row ${c.i+1}: ${c.headers[c.plate]} → Plate; ${c.headers[c.amount]} → Amount${c.authority>=0?`; ${c.headers[c.authority]} → Authority`:''}`};
}
