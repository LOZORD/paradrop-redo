#!/usr/bin/env node

function genFakeData(data, apid, startts, stopts, stepts, rssi, mac) {
    for(i = startts; i < stopts; i+= stepts) {
        data[data.length] = {apid: apid, ts: i, rssi: rssi, sendmac: mac};
    }
    return data;
}

// Running as script
if(require.main === module) {
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    }
    var ts = Math.floor(Date.now() / 1000);
    console.log('SCRIPT: ' + ts);
    var data = [];

    //mac0 there for 10 mins
    data = genFakeData(data, "ap0", ts-600, ts, 15, -50, "mac0");
    
    //mac1 there for 5 mins
    data = genFakeData(data, "ap0", ts-300, ts, 15, -50, "mac1");

    //mac2 there for 15 mins
    data = genFakeData(data, "ap0", ts-900, ts, 15, -50, "mac2");
    
    // Load in the Recon data parser
    var Recon = require('./recon');
    
    var recon = new Recon();

    recon.parseData(data);
    //recon.printData();
    
    var repeatData = ['mac0', 'mac2', 'mac5', 'mac6'];

    var graphData = recon.getRepeatVisits(repeatData);
    console.log(graphData);
}
// Running as module
else {
    console.log('MODULE');




}




