#!/bin/bash


cd $(dirname "$0")
./mzcr2data.py
cd ../../
git commit -m "Update"
git push
