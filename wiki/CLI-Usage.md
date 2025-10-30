# CLI Usage Guide

**How to chat with your local LLMs via command line**

This guide assumes you've completed the [Getting Started](Getting-Started) guide.

---

## Launching Models

### Basic Launch

```bash
# Activate Python environment (if not already active)
source ~/torch-env/bin/activate

# Navigate to doctrine directory
cd ~/.config/llm-doctrine

# Launch a model by tier
./daily-bootstrap.sh {fast|edit|qa|plan}
```

**Note**: The `daily-bootstrap.sh` script was automatically created by `initial-bootstrap.sh` during setup.

### Model Tiers

| Tier     | Command                     | Port | Model          | VRAM    |
| -------- | --------------------------- | ---- | -------------- | ------- |
| **fast** | `./daily-bootstrap.sh fast` | 8100 | Llama-3.2-1B   | 2-3GB   |
| **edit** | `./daily-bootstrap.sh edit` | 8300 | Phi-3.5-mini   | 4-5GB   |
| **qa**   | `./daily-bootstrap.sh qa`   | 8500 | Mistral-7B     | 7-8GB   |
| **plan** | `./daily-bootstrap.sh plan` | 8700 | StarCoder2-15B | 14-16GB |

### What Happens When You Launch

```bash
$ ./daily-bootstrap.sh qa

🚀 Launching qa (mistralai/Mistral-7B-Instruct-v0.3) on port 8500
📝 Logs: ./logs/qa_8500.log
⏳ Loading model...

INFO:     Started server process
INFO:     Application startup complete.
```

**Model is ready** when you see "Application startup complete"

---

## Chatting with curl

### Simple Chat

```bash
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Hello, who are you?"}
    ]
  }'
```

**Response**:

```json
{
  "id": "cmpl-abc123",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I'm a helpful AI assistant..."
      }
    }
  ]
}
```

### Extract Just the Response

Use `jq` to parse JSON:

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "What is 2+2?"}
    ]
  }' | jq -r '.choices[0].message.content'
```

**Output**:

```
2 + 2 equals 4.
```

### Multi-Turn Conversation

To maintain context, include previous messages:

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "My favorite color is blue"},
      {"role": "assistant", "content": "That'\''s great! Blue is a calming color."},
      {"role": "user", "content": "What was my favorite color?"}
    ]
  }' | jq -r '.choices[0].message.content'
```

**Output**:

```
Your favorite color is blue.
```

### Control Response Length

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Explain quantum computing"}
    ],
    "max_tokens": 100
  }' | jq -r '.choices[0].message.content'
```

**max_tokens limits response length**:

- 50-100: Short, concise answers
- 200-500: Detailed explanations
- 1000+: Long-form content

### Adjust Temperature (Creativity)

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Write a creative story opening"}
    ],
    "temperature": 0.9
  }' | jq -r '.choices[0].message.content'
```

**Temperature values**:

- 0.0-0.3: Focused, deterministic (good for code)
- 0.5-0.7: Balanced (default)
- 0.8-1.0: Creative, varied (good for stories)

---

## Health Checks

### Check If Model Is Running

```bash
curl http://localhost:8500/health
```

**Response if running**:

```
OK
```

### List Available Models

```bash
curl http://localhost:8500/v1/models
```

**Response**:

```json
{
  "object": "list",
  "data": [
    {
      "id": "mistralai/Mistral-7B-Instruct-v0.3",
      "object": "model",
      "owned_by": "huggingface"
    }
  ]
}
```

### Using Test Script

```bash
./test-connection.sh 8500
```

**Comprehensive check**:

- ✅ Health endpoint
- ✅ Model listing
- ✅ Chat completion test

---

## Managing Models

### Stop a Model

In the terminal where model is running:

1. Press `Ctrl+C`

**Or** find and kill the process:

```bash
# Find process ID
ps aux | grep vllm

# Kill it
kill <PID>
```

### Run Multiple Models (16GB+ VRAM)

Open separate terminals for each:

**Terminal 1**:

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./daily-bootstrap.sh fast  # Port 8100
```

**Terminal 2**:

```bash
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./daily-bootstrap.sh qa    # Port 8500
```

Now you can chat with either:

```bash
# Chat with fast tier
curl http://localhost:8100/v1/chat/completions ...

# Chat with QA tier
curl http://localhost:8500/v1/chat/completions ...
```

### Background Running (tmux)

Keep models running after closing terminal:

```bash
# Start tmux session
tmux new -s llm-qa

# Launch model
source ~/torch-env/bin/activate
cd ~/.config/llm-doctrine
./daily-bootstrap.sh qa

# Detach: Press Ctrl+B, then press D

# Reattach later
tmux attach -t llm-qa

# Kill session
tmux kill-session -t llm-qa
```

---

## Monitoring

### View Logs

Models log to `./logs/` directory:

```bash
# View live logs
tail -f ./logs/qa_8500.log

# View last 50 lines
tail -n 50 ./logs/qa_8500.log

# Search logs for errors
grep -i error ./logs/qa_8500.log
```

### Monitor GPU Usage

```bash
# One-time check
nvidia-smi

# Live monitoring (updates every 2 seconds)
watch -n 2 nvidia-smi
```

**What to watch**:

- **GPU Memory-Usage**: Should be 70-90% of VRAM for model tier
- **GPU-Util**: Spikes to 80-100% during inference
- **Temperature**: Should stay under 85°C

---

## Advanced Usage

### Streaming Responses

```bash
curl http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Write a short poem about code"}
    ],
    "stream": true
  }'
```

**Output**: Tokens stream as they're generated (similar to ChatGPT typing effect)

### System Prompts

Set behavior/context for the conversation:

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "system", "content": "You are a helpful Python programming tutor. Keep answers concise."},
      {"role": "user", "content": "How do I read a file in Python?"}
    ]
  }' | jq -r '.choices[0].message.content'
```

### Batch Processing

Save messages to a file:

```bash
# questions.txt
What is recursion?
What is a binary tree?
What is Big O notation?
```

Process each line:

```bash
while IFS= read -r question; do
  echo "Q: $question"
  curl -s http://localhost:8500/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"mistralai/Mistral-7B-Instruct-v0.3\",
      \"messages\": [{\"role\": \"user\", \"content\": \"$question\"}],
      \"max_tokens\": 100
    }" | jq -r '.choices[0].message.content'
  echo "---"
done < questions.txt
```

---

## Common Patterns

### Code Generation

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Write a Python function that finds the maximum value in a list without using max()"}
    ],
    "temperature": 0.3
  }' | jq -r '.choices[0].message.content'
```

### Code Explanation

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "Explain this code:\n\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)"}
    ]
  }' | jq -r '.choices[0].message.content'
```

### Debugging Help

```bash
curl -s http://localhost:8500/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistralai/Mistral-7B-Instruct-v0.3",
    "messages": [
      {"role": "user", "content": "I'\''m getting a KeyError in Python when accessing a dictionary. What causes this and how do I fix it?"}
    ]
  }' | jq -r '.choices[0].message.content'
```

---

## Troubleshooting

### "Connection refused"

**Cause**: Model isn't running or wrong port

**Fix**:

```bash
# Check if model is running
curl http://localhost:8500/health

# Check correct port
ps aux | grep vllm
```

### Slow Responses

**Cause**: CPU mode, insufficient VRAM, or large model

**Fix**:

- Check GPU is being used: `nvidia-smi`
- Try smaller model tier
- Reduce `max_tokens`

### JSON Parse Errors

**Cause**: Invalid JSON in request

**Fix**:

- Use proper escaping for quotes: `'\''` for single quote in bash
- Validate JSON: `echo '{"key": "value"}' | jq .`
- Use files for complex requests

---

## Next Steps

- **[Model Configuration](Model-Configuration)** - Switch models, manage VRAM
- **[Testing Guide](Testing-Guide)** - Automated validation
- **[Troubleshooting](Troubleshooting)** - Solve common problems

---

**Need help?** → [Troubleshooting Guide](Troubleshooting) | [FAQ](FAQ)
