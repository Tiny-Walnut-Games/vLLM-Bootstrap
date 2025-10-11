#!/usr/bin/env bash
# -------------------------------------------------------------------
# MIT License
#
# Copyright (c) 2025 Jerimiah Michael Meyer (@jmeyer1980)
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
# -------------------------------------------------------------------
# doctrine-version: 2025.10.10

set -e

PORT=${1:-8100}

echo "🔍 Testing vLLM server on port $PORT..."
echo ""

# Test 1: Health check
echo "1️⃣ Health Check..."
if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
  echo "   ✅ Server is healthy"
else
  echo "   ❌ Server health check failed"
  echo "   💡 Make sure a model is running on port $PORT"
  exit 1
fi

# Test 2: Models endpoint
echo ""
echo "2️⃣ Available Models..."
MODELS=$(curl -s "http://localhost:$PORT/v1/models" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join(['   - ' + m['id'] for m in data.get('data', [])]))" 2>/dev/null)
if [ -n "$MODELS" ]; then
  echo "$MODELS"
else
  echo "   ⚠️  Could not retrieve model list"
fi

# Test 3: Chat completion
echo ""
echo "3️⃣ Chat Completion Test..."
RESPONSE=$(curl -s "http://localhost:$PORT/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Say hello in exactly 3 words."}
    ],
    "max_tokens": 20,
    "temperature": 0.7
  }' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
  MESSAGE=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null)
  echo "   ✅ Chat completion successful"
  echo "   📝 Response: $MESSAGE"
else
  echo "   ❌ Chat completion failed"
  echo "   📋 Raw response: $RESPONSE"
  exit 1
fi

echo ""
echo "🎉 All tests passed! Server is ready for Rider integration."
echo ""
echo "📌 Connection details for Rider:"
echo "   URL: http://localhost:$PORT/v1"
echo "   Format: OpenAI Compatible"