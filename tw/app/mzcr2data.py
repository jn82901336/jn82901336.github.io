#!/usr/bin/python3
#url['prijem']='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani-distribuce.min.json';
#url['spotreba']='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani-spotreba.min.json';
#url['ockovani']='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani.min.json';
#var prijem = {};
url_ockovani='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani.min.json'
url_prijem='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani-distribuce.min.json'

import sys
import requests
import json
import string

from datetime import datetime, date
from copy import deepcopy


#from collections import defaultdict
#ockovani = defaultdict(dict)
ockovani={'CZ': {}}
ockovaniT={}
curdate=''
kraj={}
prijem={'CZ': {}}
prijemT={}
thead=''
tbody=''
try: 
 url=url_ockovani
 r=requests.get(url)
 data=r.json()
except Exception as e:
 raise Exception(e, "fetch '{0}' fail".format(url))

#modifiedO = datetime.fromisoformat(data['modified']).replace(tzinfo=None)
modifiedO=data['modified']

for r in data['data']:
#    print(r)
    if not r['datum'] == curdate:
     ockovaniT[curdate]=deepcopy(ockovani)
     curdate=r['datum']
    
    vakcina=r['vakcina'].replace('COVID-19 Vaccine ','')

    if not r['datum'] in ockovaniT:
     ockovaniT[r['datum']]={}

    if not r['kraj_nuts_kod'] in ockovani:
     ockovani[r['kraj_nuts_kod']]={vakcina: 0 }
     kraj[r['kraj_nuts_kod']]=r['kraj_nazev'].replace('kraj','').replace('Kraj','').replace('Hlavní město','')

    try:
       ockovani['CZ'][vakcina]+=r['celkem_davek']
    except KeyError:
       ockovani['CZ'][vakcina]=r['celkem_davek']

         
    try:
       ockovani[r['kraj_nuts_kod']][vakcina]+=r['celkem_davek']
    except KeyError:
       ockovani[r['kraj_nuts_kod']][vakcina]=r['celkem_davek']
       
ockovaniT[curdate]=ockovani

try: 
 url=url_prijem
 r=requests.get(url)
 data=r.json()
except Exception as e:
 raise Exception(e, "fetch '{0}' fail".format(url))

#modifiedP = datetime.fromisoformat(data['modified']).replace(tzinfo=None)
modifiedP=data['modified']
curdate=''
for r in data['data']:
#    print(curdate, r['datum'])
    if not r['datum'] == curdate:
      prijemT[curdate]=deepcopy(prijem)
      curdate=r['datum']
    
    vakcina=r['ockovaci_latka'].replace('COVID-19 Vaccine ','')

#    if not r['datum'] in prijemT:
#      prijemT[r['datum']]={}

    if not r['kraj_nuts_kod'] in prijem:
      prijem[r['kraj_nuts_kod']]={vakcina: 0 }

    elif r['cilovy_kraj_kod'] != '' and not r['cilovy_kraj_kod'] in prijem:
      prijem[r['cilovy_kraj_kod']]={vakcina: 0 }
    
    if r['akce'] == 'Příjem':
     try:
        prijem['CZ'][vakcina]+=r['pocet_davek']
     except KeyError:
        prijem['CZ'][vakcina]=r['pocet_davek']
         
     try:
        prijem[r['kraj_nuts_kod']][vakcina]+=r['pocet_davek']
     except KeyError:
        prijem[r['kraj_nuts_kod']][vakcina]=r['pocet_davek']
    elif not r['kraj_nuts_kod'] == r['cilovy_kraj_kod'] and r['cilovy_kraj_kod'] != '':
     
     try:
       prijem[r['cilovy_kraj_kod']][vakcina]+=r['pocet_davek']
     except KeyError:
       prijem[r['cilovy_kraj_kod']][vakcina]=r['pocet_davek']
     
     prijem[r['kraj_nuts_kod']][vakcina]-=r['pocet_davek']      

#    print(json.dumps(prijemT,indent=1))
#    print("#############33\n")

#print(curdate)
#prijemT[curdate]=prijem

kraj['CZ']='Celkem'

thead="<tr><th data-sorter='false'></th>"
thead2="<tr><th data-sorter='false'></th>"

for i,(vakcina) in enumerate(ockovani['CZ']):
    thead += f"<th colspan='3' data-sorter='false'>{vakcina}</th>"
    thead2+= "<th>dodáno</th><th>vyočkováno</th><th>%</th>"
thead+="</tr>\n"+thead2+"</tr>\n"

for kod,kraj in kraj.items():
   tbody += f"<tr id='{kod}'><th>{kraj}</th>"
   for vakcina,tmp in ockovani['CZ'].items():
     tbody+="<td>"+str(prijem[kod][vakcina])+"</td><td>"+str(ockovani[kod][vakcina])+"</td><td>"+str(int(round(ockovani[kod][vakcina]*100/prijem[kod][vakcina],1)))+"%</td>\n"
     
   tbody+="</tr>\n"  

free=0
for vakcina,cnt in prijem['CZ'].items():
#   print(vakcina,cnt)
   free+=cnt
   free-=ockovani['CZ'][vakcina]

with open("template.html") as t:
    template = string.Template(t.read())

final_output = template.safe_substitute(
  modifiedP=modifiedP,
  modifiedO=modifiedO,
  thead=thead,
  tbody=tbody,
  free=free,
  )
with open("../vakcinace-po-krajich.html", "w") as output:
    output.write(final_output)

#print(modifiedO)
#print(ockovani)
#j=json.loads(dict(ockovani))
#print(ockovani)
#print(json.dumps(prijemT, indent=1))
#File = open("ockovani.min.json", "w")
#File.write(json.dumps(ockovani,ensure_ascii=False,indent=1))
#File.close()
#File = open("prijem.min.json", "w")
#File.write(json.dumps(prijem,ensure_ascii=False,indent=1))
#File.close()
#File = open("../data/kraj.min.json", "w")
#File.write(json.dumps(kraj,ensure_ascii=False,indent=1))
#File.close()
File = open("../data/ockovaniT.min.json", "w")
File.write(json.dumps(ockovaniT,ensure_ascii=False,indent=1))
File.close()
File = open("../data/prijemT.min.json", "w")
File.write(json.dumps(prijemT,ensure_ascii=False,indent=1))
File.close()

