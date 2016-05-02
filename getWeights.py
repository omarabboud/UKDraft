import csv
import math
from collections import Counter
import json
from pprint import pprint
import string

output = {}

with open('distribution_large.json') as data_file:    
    data = json.load(data_file)
    for key in data:
        shortkey = string.split(key)
        shortkey = shortkey[0][:3] + shortkey[1][:1]
        # print shortkey
        if shortkey in output:
            output[shortkey] += data[key]
        else:
            output[shortkey] = data[key]

pprint(output)

table = {
    "7" : {"2.2E"},
    "10" : {"1.2B", "2.2E"},
    "15" : {"2.2A"},
    "20" : {"2.2B", "2.2E"},
    "40" : {"1.2F", "1.2B", "1.2E", "1.2C", "1.2G"},
    "50" : {"3.1B", "3.1E"},
    "52" : {"3.1B", "3.1E"},
    "60" : {'3.1A', '3.3A', '3.3D', '4.1D', '3.3D', '3.1D'},
    "70" : {'1.3F', '2.2F', '2.3F', '2.3B', '1.3B', '2.3A', '2.1F', '2.2F', '1.3A', '4.1F'}
}

for item in table:
    entry = table[item]
    table[item] = dict.fromkeys(entry, 0)

# print table

for item in table:
    counts = table[item];
    for key in counts:
        if key in output:
            counts[key] = output[key]

for item in table:
    counts = table[item];
    countList = []
    for key in counts:
        countList.append(counts[key])
    avg = sum(countList) / float(len(countList))
    counts["sum"] = sum(countList)
    for key in counts:
        if counts[key] == 0:
            counts[key] = int(avg);

pprint(table)

def printlist(a, b):
    out = []
    a = string.split(a, ", ")
    b = string.split(b, ", ")
    for i, s in enumerate(a):
        out.append(s[:3] + b[i][0])
    # print out

with open('weights-large.json', 'w') as outfile:
    json.dump(table, outfile)

# printlist("1.3.2, 2.2.3, 2.3.2, 2.3.2, 1.3.2, 2.3.2, 2.1.2, 2.2.2, 1.3.2, 4.1.2", "F, F, F, B, B, A4, F, F, A, F")

# pprint(output)

# pprint(data)