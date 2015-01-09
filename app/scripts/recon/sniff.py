from lib.paradrop import out, logPrefix, json2str, str2json
from lib.internal import settings
from lib.paradrop.utils import pdutils
from lib.internal.utils import pdos
import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)
from scapy.all import *
import argparse, sys, urllib, urllib2


def getAPGuid():
    """
        Uses the @PDFCD_GUID_PATH variable to load in the APID for this board.
    """
    p = settings.PDFCD_GUID_PATH
    # Check if it exists
    contents = pdos.readFile(p)
    if(contents):
        # Should just be 1 line of an APID string
        if(len(contents) == 1 and pdutils.isGuid(contents[0])):
            return contents[0]
    
    # Getting here means something isn't formatted properly, raise error
    out.warn("** Generating fake APID\n")
    return "00000000-0000-0000-0000-000000000000"

def printPackets(pkts):
    for pkt in pkts:
        print("packet: %s" % pkt)
        ts, rssi, sendmac = pdutils.explode(pkt, 'ts', 'rssi', 'sendmac')
        out.info("%d: %3d %s\n" % (ts, rssi, sendmac))

def getArgs():
    parser = argparse.ArgumentParser(description="Gathers WiFi traffic from a monitor iface, parses it, and posts it to the recon framework.")
    parser.add_argument('-i', '--iface', action="store", dest="iface", help="Interface to monitor", required=False)
    parser.add_argument('-c', '--pcap', action="store", dest="pcap", help="Read data from pcap file specified", required=False)
    parser.add_argument('-t', '--timeout', action="store", dest="timeout", help="Sniffing time interval (in seconds)", type=int, required=False, default=60)
    parser.add_argument('-u', '--url', action="store", dest="url",  help="Send POST of data to this URL", required=False, default="https://dev.dbapi.paradrop.io/v1/recon/data/set")
    parser.add_argument('-p', '--print', action="store_true", dest="printOnly",  help="Flag to only print the packets, don't POST them to recon", required=False)
    parser.add_argument('-f', '--filter', action="store", dest="filter",  help="Filter for sniffer", required=False, type=str, default="")
    parser.add_argument('--stop', action="store_true", dest="stop",  help="Specifying this stops the sniffing after one timeout period", required=False)
    args = parser.parse_args()
    return args
    
def processRequests(pcap_list):
    """
        Takes a list of packets from scapy and pulls out Probe Requests specifically.
        Returns:
            List of dicts of processed Probe Requests
            None if error
    """
    try:
        track = {}
        # First go through and parse out all data, store it in a dict[tup(...)] = [rssi's]
        for i in pcap_list:
            #print("i: %s" % i.show())
            #print("type: %s" % i.type)
            #print("subtype: %s" % i.subtype)
            rssi =  (ord(i.notdecoded[-4:-3]) - 256) 
            # Keys: sendmac, ts, type, subtype
            tup = (i.addr2, int(i.time), int(i.type), int(i.subtype))
            # Check if this exact tuple has been seen before
            if(tup not in track):
                track[tup] = []
            #print(tup, rssi)
            # Need to append so we can AVG rssi once we have them all
            track[tup].append(rssi)

        ret = []
        # Now we go through the track var, avg any required parts, and convert into a list of dicts to send
        for k, v in track.iteritems():
            # Explode tuple
            sm, ts, t, st = k
            # Compute avg
            rssi = int(sum(v) / len(v))
            #print(sm, ts, t, st, rssi, v)
            ret.append({"sendmac":sm, "ts": ts, "type": t, "subtype": st, "rssi": rssi})
        
        return ret
    except KeyboardInterrupt as i:
        raise i
    except Exception as e:
        out.err('!! %s Error: %s\n' % (logPrefix(), str(e)))
        return None

def processProbeRequests(pcap_list):
    """
        Takes a list of packets from scapy and pulls out Probe Requests specifically.
        Returns:
            List of dicts of processed Probe Requests
            None if error
    """
    try:
        track = {}
        # First go through and parse out all data, store it in a dict[tup(...)] = [rssi's]
        for i in pcap_list:
            if i.haslayer(Dot11ProbeReq):
                rssi =  (ord(i.notdecoded[-4:-3]) - 256) 
                # Keys: sendmac, ts, type, subtype
                tup = (i.addr2, int(i.time), int(i.type), int(i.subtype))
                # Check if this exact tuple has been seen before
                if(tup not in track):
                    track[tup] = []
                #print(tup, rssi)
                # Need to append so we can AVG rssi once we have them all
                track[tup].append(rssi)

        ret = []
        # Now we go through the track var, avg any required parts, and convert into a list of dicts to send
        for k, v in track.iteritems():
            # Explode tuple
            sm, ts, t, st = k
            # Compute avg
            rssi = int(sum(v) / len(v))
            #print(sm, ts, t, st, rssi, v)
            ret.append({"sendmac":sm, "ts": ts, "type": t, "subtype": st, "rssi": rssi})
        
        return ret
    except KeyboardInterrupt as i:
        raise i
    except Exception as e:
        out.err('!! %s Error: %s\n' % (logPrefix(), str(e)))
        return None


def postPackets(url, apid, data):
    """
        Sends the JSON object to the URL as a POST request.
        Example: https://dbapi.paradrop.io/v1/recon/data/set/<apid>
        Returns:
            True if error
            False otherwise
    """
    try: 
        data = json2str(data)
        theUrl = "%s/%s" % (url, apid)
        req = urllib2.Request(theUrl, data)
        out.info('-- %s Sending POST data to %s\n' % (logPrefix(), theUrl))
        response = urllib2.urlopen(req)
        resp = response.read()
        return False
    except Exception as e:
        out.err("!! %s Unable to send POST: %s\n" % (logPrefix(), str(e)))
        return True

def doSniff(iface, theFilter, timeout, url, apid, printOnly, forever=True):
    """
        Performs packet processing.
        Does this forever unless @forever is False
    """
    while(True):
        try:
            out.info("-- %s Sniffing: %s, filter: '%s'\n" % (logPrefix(), iface, theFilter))
            if(theFilter):
                pcap_list = sniff(iface=iface, filter=theFilter, timeout=timeout)
            else:
                pcap_list = sniff(iface=iface, timeout=timeout)

            # Process the data found by scapy
            sniff_list = processRequests(pcap_list)
            if(sniff_list is None):
                out.warn('** %s No sniff list produced\n' % logPrefix())
                if(forever is False):
                    return

            # Send the data if requested
            if(printOnly):
                printPackets(sniff_list)
            else:
                postPackets(url, apid, sniff_list)
            
            if(forever is False):
                return
        except KeyboardInterrupt:
            out.warn("Quitting\n")
            return
        except Exception as e:
            out.err('!! %s Exception: %s\n' % (logPrefix(), str(e)))

if(__name__ == "__main__"):
    # Parse out argument list
    args = getArgs()
    theIface = args.iface
    thePcap = args.pcap
    timeout = args.timeout
    url = args.url
    apid = getAPGuid()
    theFilter = args.filter
    #theFilter = 'ether host 38:aa:3c:7c:68:91'
    #theFilter = 'icmp'
    stop = args.stop
    printOnly = args.printOnly

    # Either parse a provided pcap or a monitor interface
    if(thePcap):
        out.info('-- %s Processing pcap file\n' % logPrefix())
        pcap_list = rdpcap(thePcap)
        # Process the data found by scapy
        sniff_list = processProbeRequests(pcap_list)
        if(sniff_list is None):
            exit()
        if(printOnly):
            printPackets(sniff_list)
        else:
            postPackets(url, apid, sniff_list)
    
    elif(theIface):
        out.info('-- %s Processing monitor interface\n' % logPrefix())
        doSniff(theIface, theFilter, timeout, url, apid, printOnly, not stop)
    else:
        out.warn('iface or pcap file required\n')
        exit()
