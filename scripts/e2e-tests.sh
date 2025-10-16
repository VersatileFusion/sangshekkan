#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:4000"

echo "1) Get upload-url"
DATA=$(curl -sS -X POST "$BASE/api/student/reports/upload-url" \
  -H 'Content-Type: application/json' \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -d '{"contentType":"text/plain","size":12,"originalName":"test.txt"}')
UPLOAD_URL=$(echo "$DATA" | jq -r '.uploadUrl')
FILE_KEY=$(echo "$DATA" | jq -r '.fileKey')

echo "2) PUT upload"
curl -sS -X PUT "$UPLOAD_URL" -H 'Content-Type: text/plain' --data-binary 'hello world!'

echo "3) Commit report"
curl -sS -X POST "$BASE/api/student/reports" \
  -H 'Content-Type: application/json' \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -d "{\"date\":\"$(date -I)\",\"testCount\":5,\"studyHours\":2,\"subject\":\"مطالعه\",\"fileKey\":\"$FILE_KEY\"}" | jq -c '.'

echo "4) List reports (weekly)"
curl -sS "$BASE/api/student/reports?period=weekly" --cookie cookies.txt | jq -c '.[0]'

echo "5) Stats"
curl -sS "$BASE/api/student/dashboard-stats" --cookie cookies.txt | jq -c '.'

echo "6) Notifications"
curl -sS "$BASE/api/student/notifications" --cookie cookies.txt | jq -c '.[0]'

echo "Done"




