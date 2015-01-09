///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//  MODULE: Recon                                                            //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//  DESCRIPTION: Helper class that deals with the sniff data coming from     //
//  the dbapi. Instantiate this class with the original data from the dbapi  //
//  data/get call to have it parse through the data into a reasonable format //
//  you can then use this classes methods to return objects to graph.        //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////


function Recon () {
    this.data = null;

    /**
     * Parses the raw data into a more digestable form.
     *
     * This form will be:
     *  data[mac0] = {
     *                  ts0: [
     *                          [ap0, rssi0]
     *                          [ap1, rssi1]
     *                              ...
     *                       ],
     *                  ts1: [ ]
     *                    ...
     *               },
     */
    this.parseData = function(data) {
        var ts = Math.floor(Date.now() / 1000);
        console.log("Parsing data..." + ts);
        //console.log(data);

        this.data = {};
        
        // Run through all data to fill up
        for (i = 0; i < data.length; i++) {
            var mac = data[i].sendmac;
            var ts = data[i].ts;
            var ap = data[i].apid;
            var rssi = data[i].rssi;

            // Do we know this mac?
            if(!(mac in this.data)) {
                this.data[mac] = {};
                //console.log('New mac: ' + mac);
            }

            // Do we know the ts for this mac?
            if(!(ts in this.data[mac])) {
                this.data[mac][ts] = {inside: true, signals: []};
                //console.log('New ts: ' + ts);
            }

            // Shove all (ap, rssi) data into proper place
            this.data[mac][ts].signals.push({ap: ap, rssi: rssi});
        }
        //console.log(this.data);
        
        //TODO
        /*
         * Now go through data to see if it is inside or not:
         * NOTE: we cannot do this above because we don't have all the signals from the different APs until
         *       we get here
         */
    }

    /**
     * Debug the this.data object by printing everything to log
     */
    this.printData = function() {
        if(this.data !== null) {
            console.log('== Internal Recon.data:');
            var indent = "";
            var oldIndent = "";

            for(var mac in this.data) {
                console.log(mac + ':');
                indent = "    ";
                for(var ts in this.data[mac]) {
                    console.log(indent + ts + ':');
                    oldIndent = indent;
                    indent = "        ";
                    if(this.data[mac][ts].inside)
                        console.log(indent + "(INSIDE)");
                    else
                        console.log(indent + "(OUTSIDE)");

                    for(i = 0; i < this.data[mac][ts].signals.length; i++) {
                        var obj = this.data[mac][ts].signals[i];
                        console.log(indent + obj.ap + ": " + obj.rssi);

                    }
                    indent = oldIndent;
                }
            }
        }
    }

    /**
     *  Breaks down the this.data object to return a tmp data object:
     *  This object looks like the following:
     *    {mac0: [{duration: sec, start: ts, stop: ts}, ...]}
     *  There can be multiple separate durations, each will be broken down by
     *  if there was a TS that was NOT listed as inside.
     */
    this.breakdownTimeDuration = function() {
        //console.log('Getting Time Duration breakdown');
        var tmp = {};
        // For each mac
        for(var mac in this.data) {
            // We need to guarantee there are at least 2 ts's in the data for this to work
            if(this.data[mac].length < 2) {
                console.log('Skipping ' + mac + ' not enough data');
                continue;
            }
            var minTS = undefined;
            var maxTS = undefined;
            // For each ts this mac has been seen
            for(var ts in this.data[mac]) {
                // Was this TS thought to be inside?
                if(this.data[mac][ts].inside){
                    // Start the clock if we didn't already
                    if(minTS === undefined) {
                        minTS = ts;
                    }
                    // Hold onto each maxTS as if it was the last
                    else {
                        maxTS = ts;
                    }
                }
                // TS outside
                else {
                    // A valid min/max means we have a duration to store
                    if(minTS !== undefined && maxTS !== undefined) {
                        if(!(mac in tmp)) {
                            tmp[mac] = [];
                        }
                        tmp[mac].push({duration: maxTS-minTS, start: minTS, stop: maxTS});
                        // Reset the min/max to undef so we can start a new check
                        minTS = maxTS = undefined;
                    }
                }
            } //TS
            // Once we have gone through the list, we need to check min/max once more to add stuff
            if(minTS !== undefined && maxTS !== undefined) {
                if(!(mac in tmp)) {
                    tmp[mac] = [];
                }
                tmp[mac].push({duration: maxTS-minTS, start: minTS, stop: maxTS});
            }
        } //MAC
        return tmp;
    }

    /**
     * Returns X,Y data objects that should be used to plot graphs like
     * "Total Number of Customers vs Time"
     *
     * Arguments:
     *  startts     : The TS to start looking for data
     *  stopts      : The TS to stop looking for data
     *  granularity : The granularity in seconds to group data
     *
     * Returns:
     *  reconGraphObject = {x: X data, y: Y data, ...}
     */
    this.getTotalGroupByTS = function(start, stop, gran) {
        console.log('getTotalGroupByTS: ' + start + '-' + stop);
        // First define the X time vector
        var x = [];
        for(i = start; i <= stop+gran; i += gran) {
            x[x.length] = i;
        }

        // Initialize Y data
        var y = [];
        for(i = 0; i < x.length; i += 1) {
            y[i] = 0;
        }

        // Parse through all data looking for Y data (+= 1 when found)
        // For each mac
        for(var mac in this.data) {
            var xptr = 0;
            // For each ts this mac has been seen
            for(var ts in this.data[mac]) {
                // Use the fact that both TS list for macs and x's are in order
                // 0) Was this TS thought to be inside?
                if(!this.data[mac][ts].inside){
                    continue;
                }
                // 1) ts behind window, continue: data too old
                if(ts < x[xptr]) {
                    continue;
                }
                // 2) window behind ts, inc window to catch up
                else if(ts > x[xptr+1]) {
                    var finish = false;
                    while(ts > x[xptr+1]) {
                        // Did we run out of window buckets?
                        if(xptr == x.length+1) {
                            finish = true;
                            break;
                        }
                        xptr++;
                    }
                    // Done for this MAC's TS's
                    if(finish) {
                        break;
                    }
                }
                // NOTE: this is an IF, not ELSE IF so that from 2) we can check the window for the newest xptr 
                // 3) ts inside window, inc Y, inc window so we don't count this MAC again
                if(x[xptr] <= ts && ts < x[xptr+1]) {
                    y[xptr]++;
                    xptr++;
                    if(xptr == x.length+1) {
                        break;
                    }
                }

            } //TS
        } //MAC

        // Last thing, to make the logic easier we added an extra index at the end, remove it now
        x = x.slice(0, -1);
        y = y.slice(0, -1);
        return {x: x, y: y};
    }

    /**
     * Returns X,Y data objects that should be used to plot graphs like
     * "Pie chart of Customer Engagement" ie. what percent of people spent
     * between 5-10 mins in the store.
     *
     * Arguments:
     *  buckets : Array of seconds to split the data 
     *
     * Example:
     *  getEngagementByTS([0, 300, 600, 900])
     *    Breakdown customers into those spending:
     *      0-5 mins, 5-10 mins, 10-15 mins, 15+ mins
     *
     * Note:
     *  - If buckets starts at > 0, it will throw out anything between 0 and buckets[0]
     *
     * Returns:
     *  {x: X data, y: Y data, ...}
     */
    this.getEngagementByTS = function(buckets) {
        console.log('getEngagementByTS: ' + buckets);
        // Initialize Y data
        var y = [];
        for(i = 0; i < buckets.length; i++) {
            y[i] = 0;
        }

        // Returns a mapping of {mac: [insideDuration0, ...]}
        var tmpData = this.breakdownTimeDuration();

        // For each mac in the temp data, determine what time duration it falls into
        for(var mac in tmpData) {
            for(dur = 0; dur < tmpData[mac].length; dur++) {
                var d = tmpData[mac][dur].duration;
                var found = false;
                // Compare the duration against the buckets to figure out where it goes
                for(i = 0; i < buckets.length-1; i++) {
                    if(buckets[i] <= d && d < buckets[i+1]) {
                        y[i]++;
                        found = true;
                        break;
                    }
                }
                // If there was no match, then make sure its greater than the largest bucket and insert it
                if(!found && d > buckets[buckets.length-1]) {
                    y[buckets.length-1]++;
                }
            }
        }
        return {y: y};
    }

    /**
     *  Calculates the number of new vs returning customers based on the provided list of macs.
     *
     *  Arguments:
     *      @seenMacs : a list of all MACs that have been seen
     *
     *  Returns:
     *      {total: #, repeat: #}
     */
    this.getRepeatVisits = function(seenMacs) {
        var repeats = 0;
        var total = 0;
        for(var mac in this.data) {
            total++;
            for(i = 0; i < seenMacs.length; i++){
                if(mac == seenMacs[i]) {
                    repeats++;
                    break;
                }
            }
        }

        return {total: total, repeat: repeats};
    }

}


// Export Recon to the world
module.exports = Recon;

