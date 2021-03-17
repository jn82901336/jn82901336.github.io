#!/usr/bin/python3
url_ecdc='https://opendata.ecdc.europa.eu/covid19/vaccine_tracker/json'
url_ockovani='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani.min.json'
url_prijem='https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/ockovani-distribuce.min.json'
#url_ecdc='http://localhost/tw/data/ecdc.json'
#url_ockovani='http://localhost/tw/data/ockovani.min.json'
#url_prijem='http://localhost/tw/data/ockovani-distribuce.min.json'

import sys
import requests
import json
import string
import locale
import datetime
from isoweek import Week

#from datetime import datetime, date
from copy import deepcopy


locale.setlocale(locale.LC_ALL, 'cs_CZ.UTF-8')


ecdc2cz={
'COM': "Comirnaty",
'MOD': "Moderna",
'AZ':  "AstraZeneca",
}
ockovani={'CZ': {}}
ockovaniT={}
ecdcT={}
ecdc={}
curdate=''
kraj={}
prijem={'CZ': {}}
prijemT={}
thead=''
tbody=''

try:
 url=url_ecdc
 r=requests.get(url)
 data=r.json()
except Exception as e:
 raise Exception(e, "fetch '{0}' fail".format(url))

for r in data['records']:
 if r['Region'] == 'CZ' and r['TargetGroup']=='ALL':
  w = Week.fromstring(r['YearWeekISO'])
  dt=w.tuesday().isoformat()
  if r['YearWeekISO'] == '2020-W52':
   dt='2020-12-26'
  
  vakcina=ecdc2cz[r['Vaccine']]
   
  if not dt in ecdcT:
   ecdcT[dt]={}
  ecdcT[dt][vakcina]=r['NumberDosesReceived']
  
  if not vakcina in ecdc:
   ecdc[vakcina]=0;
  ecdc[vakcina]+=r['NumberDosesReceived']
  

  

try: 
 url=url_ockovani
 r=requests.get(url)
 data=r.json()
except Exception as e:
 raise Exception(e, "fetch '{0}' fail".format(url))


#modifiedO = datetime.fromisoformat(data['modified']).replace(tzinfo=None)
modifiedO=data['modified'].split('T');

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
modifiedP=data['modified'].split('T');
curdate=''
for r in data['data']:
    if not r['datum'] == curdate:
      prijemT[curdate]=deepcopy(prijem)
      curdate=r['datum']
    
    vakcina=r['ockovaci_latka'].replace('COVID-19 Vaccine ','')

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


prijemT[curdate]=prijem


kraj['CZ']='Celkem ČR'

thead="<tr><th data-sorter='false'></th>"
thead2="<tr><th data-sorter='false'><input data-column='all' class='search tablesorter-filter' type='search' name='search'></th>"

for i,(vakcina) in enumerate(ockovani['CZ']):
    thead += f"<th colspan='3' data-sorter='false'>{vakcina}</th>"
    thead2+= "<th data-filter='false'>dodáno</th><th data-filter='false'>vyočkováno</th><th data-filter='false'>%</th>"
thead+="</tr>\n"+thead2+"</tr>\n"

for kod,kraj in kraj.items():
   tbody += f"<tr id='{kod}'><th>{kraj}</th>"
   for vakcina,tmp in ockovani['CZ'].items():
     tbody+="<td>"+str(prijem[kod][vakcina])+"</td><td>"+str(ockovani[kod][vakcina])+"</td><td>"+str(int(round(ockovani[kod][vakcina]*100/prijem[kod][vakcina],1)))+"%</td>\n"
     
   tbody+="</tr>\n"  

free=0
freeCS=0
cs=''
for vakcina,cnt in prijem['CZ'].items():
#   print(vakcina,cnt)
   free+=cnt
   free-=ockovani['CZ'][vakcina]
   if ecdc[vakcina]-cnt > 0:
    freeCS+=ecdc[vakcina]-cnt
    cs+=vakcina+": "+str(ecdc[vakcina]-cnt)+" "
   else:
    cs+=vakcina+": ? "
    
with open("template.html") as t:
    template = string.Template(t.read())

final_output = template.safe_substitute(
  modifiedP=modifiedP[0],
  modifiedO=modifiedO[0],
  thead=thead,
  tbody=tbody,
  free=free,
  freeCS=freeCS,
  freeT=(freeCS+free),
  cs=cs,
  dnes=datetime.date.today().strftime("%d %B %Y"),

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
File = open("../data/ecdcT.min.json", "w")
File.write(json.dumps(ecdcT,ensure_ascii=False,indent=1))
File.close()
File = open("../data/ockovaniT.min.json", "w")
File.write(json.dumps(ockovaniT,ensure_ascii=False,indent=1))
File.close()
File = open("../data/prijemT.min.json", "w")
File.write(json.dumps(prijemT,ensure_ascii=False,indent=1))
File.close()

print((modifiedO[0]==modifiedP[0]))


