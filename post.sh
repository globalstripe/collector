curl -X POST http://localhost:3002/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "bufferLevel": 8.2,
    "bitrate": 1800,
    "rebuffering": 1,
    "clientId": "user123"
  }'
