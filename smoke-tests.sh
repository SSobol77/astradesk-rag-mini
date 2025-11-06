#!/bin/bash
set -e

echo "=== AstraDesk RAG Mini - Smoke Tests ==="
echo ""

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_KEY="${RAG_API_KEY:-}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Helper function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    local headers=$4
    
    echo -n "Testing $name... "
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" $headers "$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected, got $status)"
        echo "Response: $body"
        return 1
    fi
}

# Test 1: Health Check
test_endpoint "Health Check" "$BASE_URL/health" "200"

# Test 2: Actuator Health
test_endpoint "Actuator Health" "$BASE_URL/actuator/health" "200"

# Test 3: Prometheus Metrics
test_endpoint "Prometheus Metrics" "$BASE_URL/actuator/prometheus" "200"

# Test 4: Search Endpoint (empty results OK)
test_endpoint "Search Endpoint" "$BASE_URL/docs/search?q=test&k=1" "200"

# Test 5: API Key (if enabled)
if [ -n "$API_KEY" ]; then
    test_endpoint "API Key Auth" "$BASE_URL/docs/search?q=test" "200" "-H 'X-API-Key: $API_KEY'"
fi

echo ""
echo "=== Smoke Tests Complete ==="
