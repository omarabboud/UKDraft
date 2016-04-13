import csv
import math
from collections import Counter
import json

data = [];
codeRanges = [(1,9), (10, 14), (15, 17), (20, 39), (40, 49), (50,51), (52, 59), (60,67), (70,89), (91,99)];
SIC = [7, 10, 15, 20, 40 ,50, 52, 60, 70,91]
output = [ [] for i in xrange(len(codeRanges))]

with open('distribution.csv', 'rb') as csvfile:
   spamreader = csv.reader(csvfile, delimiter=',', quotechar='|')
   for row in spamreader:
        sic = int(int(row[0])/100)
        code = row[1].replace(" ", "").replace("Div","G")
        for i in xrange(len(codeRanges)):
            r = codeRanges[i]
            if sic >= r[0] and sic <=r[1]:                
                output[i].append(code)

data = {};
for i, entry in enumerate(output):
    counts = dict(Counter(entry))
    counts["sum"] = len(entry)
    # counts["SIC"] = SIC[i]
    data[SIC[i]] = counts

# print json

with open('weights.json', 'w') as outfile:
    json.dump(data, outfile)