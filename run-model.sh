#!/usr/bin/env bash
# Launch model in visible Git Bash terminal window

if [ -z "$1" ]; then
  echo "Usage: ./run-model.sh {fast|edit|qa|plan}"
  exit 1
fi

MODEL_ROLE=$1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

start bash --norc -c "cd '$SCRIPT_DIR' && source ~/torch-env/bin/activate && bash ./daily-bootstrap.sh $MODEL_ROLE; read -p 'Press enter to close...'"
