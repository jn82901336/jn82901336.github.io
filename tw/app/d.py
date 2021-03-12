#!/usr/bin/python3

import sys
import locale
import datetime
locale.setlocale(locale.LC_ALL, 'cs_CZ.UTF-8')
print(datetime.date.today().strftime("%d %B %Y"))
