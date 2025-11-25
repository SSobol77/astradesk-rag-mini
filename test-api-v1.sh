#!/bin/bash
# Test script for API v1 endpoints

PORT=${1:-8081}
BASE_URL="http://localhost:$PORT/api/v1"

echo "========================================="
echo "Testing AstraDesk RAG API v1"
echo "========================================="
echo ""

echo "1. Health Endpoint"
echo "GET $BASE_URL/health"
curl -s "$BASE_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/health"
echo -e "\n"

echo "2. Search Endpoint (empty database)"
echo "GET $BASE_URL/docs/search?q=test&k=3"
curl -s "$BASE_URL/docs/search?q=test&k=3" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/docs/search?q=test&k=3"
echo -e "\n"

echo "3. Create test file for ingestion"
echo "Test document content" > /tmp/test.txt
zip -q /tmp/test.zip /tmp/test.txt
echo "✅ Created /tmp/test.zip"
echo ""

echo "4. Ingest Endpoint (SSE stream)"
echo "POST $BASE_URL/ingest/zip"
curl -X POST -F "file=@/tmp/test.zip" "$BASE_URL/ingest/zip" --no-buffer 2>/dev/null | head -20
echo -e "\n"

echo "========================================="
echo "✅ API v1 Tests Complete"
echo "========================================="
