#!/bin/bash
cd /home/tiny-walnut-games
source torch-env/bin/activate  
python3 -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.2-1B --port 8100 --gpu-memory-utilization 0.25 2>&1 | tee /tmp/model_launch.log
