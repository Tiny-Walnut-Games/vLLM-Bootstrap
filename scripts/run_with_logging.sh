#!/bin/bash
cd /mnt/e/Tiny_Walnut_Games/vLLM-Bootstrap/scripts
source ~/torch-env/bin/activate 2>&1 | tee -a run_log.txt
echo "=== Starting vLLM ===" >> run_log.txt
python3 -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.2-1B \
  --port 8100 \
  --gpu-memory-utilization 0.25 \
  --tensor-parallel-size 1 \
  --pipeline-parallel-size 1 \
  2>&1 | tee -a run_log.txt
