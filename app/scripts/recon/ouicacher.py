from lib.paradrop import out, logPrefix, json2str, str2json
from lib.internal.utils import pdos
import argparse, sys, urllib, urllib2, re



def getArgs():
    parser = argparse.ArgumentParser(description="Download the OUI database and generate a cached version")
    parser.add_argument('--ouiurl', action="store", help="Location of OUI database text", type=str, default="http://www.ieee.org/netstorage/standards/oui.txt")
    parser.add_argument('--ouitext', action="store", help="Use this text file rather than fetching from online using --ouiurl", type=str, default=None)
    parser.add_argument('-v', '--verbose', help='Enable verbose', action='store_true')
    parser.add_argument('--ouifile', action="store", help="Location to store the OUI cache", required=False, type=str, default="/tmp/ouicache.json")
    args = parser.parse_args()
    return args
    
def getOUIData(url):
    """
        Gets a text file thats expected to be OUI data
        Returns:
            str of data
            None in error
    """
    try:
        req = urllib2.Request(url, None)
        out.info('-- %s Sending GET request\n' % logPrefix())
        response = urllib2.urlopen(req)
        resp = response.read()
        return resp
    except Exception as e:
        out.err("!! %s Unable to get OUI: %s\n" % (logPrefix(), str(e)))
        return None

def parseOUIData(data, convert=True):
    """
        Takes a text file of OUI data and converts it into a simplified JSON format.
        Arguments:
            @data    : The input text, expected to be one long string
            @convert : Boolean whether to convert the MAC from uppercase-dash delimited to lowercase-colon delimited
        Returns:
            dict of data
            None in error

        Example input:
            F4-20-12   (hex)              Cuciniale GmbH
            F42012     (base 16)          Cuciniale GmbH
                                          Heuriedweg 65
                                          Lindau  88131
                                          GERMANY
        Example output:
            {"f4:20:12": "Cuciniale GmbH"}
    """
    # Convert from text back into array based on \n's
    data = data.split('\n')
    
    # Setup regex to find the lines we want
    re_mac = re.compile('.*[A-F0-9]{2}-[A-F0-9]{2}-[A-F0-9]{2}.*')

    json = {}
    # Look through list
    for line in data:
        # Search for a match to this: F4-20-12   (hex)              Cuciniale GmbH
        m = re_mac.match(line)
        if(m):
            # Split up string so we can use it
            l = line.split()
            # Now we want l[0] and everything after l[1]
            if(convert):
                mac = l[0].lower().replace('-', ':')
            else:
                mac = l[0]
            # Get company name
            comp = ' '.join(l[2:])
            json[mac] = comp
    
    return json

def storeOUIData(ouifile, data):
    """
        Stores the JSON object to a file, using a minification (remove whitespace) of the JSON.
        Return:
            True in error
            False otherwise
    """
    try:
        filedata = json2str(data, ": ,&()/+*!")
        pdos.write(ouifile, filedata, 'w')
        out.info('-- %s Wrote out OUI to %s\n' % (logPrefix(), ouifile))
        return False
    except Exception as e:
        out.err('!! %s Unable to write OUI: %s\n' % (logPrefix(), str(e)))
        return True

if(__name__ == "__main__"):
    # Parse out argument list
    args = getArgs()

    # Only download from internet if they don't specify a local copy
    if(args.ouitext is not None):
        out.info('-- %s Pulling OUI from file\n' % logPrefix())
        ouidata = pdos.readFile(args.ouitext, False)
    else:
        ouidata = getOUIData(args.ouiurl)

    if(ouidata is None or len(ouidata) < 1):
        out.err('!! %s Unable to get OUI data\n' % logPrefix())
        exit(1)
    
    # Convert text to JSON
    ouijson = parseOUIData(ouidata)
    
    # Store JSON to file
    storeOUIData(args.ouifile, ouijson)

