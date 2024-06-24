#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f statistischer-bericht-kohortensterbetafeln-5126101239005.xlsx ]]; then
  echo "downloading kohortensterbetafeln"
  curl --fail -sO https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/Downloads-Sterbefaelle/statistischer-bericht-kohortensterbetafeln-5126101239005.xlsx?__blob=publicationFile
fi

(sleep 2; open http://localhost:8000) &
python -m SimpleHTTPServer 8000
