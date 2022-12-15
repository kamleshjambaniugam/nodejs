const s3 = require('./models/s3bucket');
const XLSX = require('xlsx');

exports.handler = async (event, context) => {
//console.log('Received event:', JSON.stringify(event, null, 2));

// Get the object from the event and show its content type
const bucket = event.Records[0].s3.bucket.name;
const fileName = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
// assdc-file.xls
const tempArray = fileName.split('.');
const type = tempArray[1];
const params = {
Bucket: bucket,
Key: fileName,
}; 
try {
const object = await s3.getObject(params).promise();
//const json = JSON.parse(new Buffer.from(object.Body).toString("utf8"));
console.log("File type in conver lambda is "+type);
console.log('Object is '+JSON.stringify(object));
const fileContent = object.Body.toString(); // to convert object to string 
let jsonObject;
console.log('File Content is '+fileContent);

if(type === 'csv'){
jsonObject = convertCSVToJSON(fileContent);
//console.log(fileContent);
} else{
const excel = XLSX.read(Buffer.from(object.Body.buffer), {type:'buffer'})
jsonObject = JSON.stringify(XLSX.utils.sheet_to_json(excel.Sheets[excel.SheetNames[0]]));
}
console.log(jsonObject);

//uploading the json file to destination bucket

// fileName = 2324ads-file.json

const UploadParams = {

Bucket : 'sk-convert-bucket', 
Key : fileName.split('.')[0] + ".json",
Body : jsonObject,
}
await s3.upload(UploadParams).promise();

} 
catch (err) {
console.log(err);
// const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
// console.log(message);
// throw new Error(message);
}
};

/*
a,b,c,d
1,2,3,4
5,6,7,8
*/

const convertCSVToJSON = (csvData) =>{
//split lines
const lines = csvData.split('\n'); //['a,b,c','1,2,3,4','5,6,7,8']
const json = [] //For final json Array
//Get headers which are the first index in lines array and split them 
const headers = lines[0].split(',') // [a,b,c]

lines.splice(0,1) //Remove the headers line

//Iterate over lines 
for(const l of lines){

if(l === ""){ //avoid iterating over empty line if present
break;
}

const obj = {} //For storing json of each lines

//split each line such that 'a,b,c' => [a,b,c]
const values = l.split(',') 

//Iterate over headers array and assign each header a value from values array ablove
for(i in headers){
obj[headers[i]] = values[i] 
}

//Add the obj into json array
json.push(obj)
}


return JSON.stringify(json)
}
