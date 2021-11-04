#!/bin/bash
set -x

cd $(dirname "$0")
R=$(./mzcr2data.py)
if [ x"$R" = x"True" ] ; then
 cd ../../
 git add *
 git commit -m "Update"
 git push
fi
