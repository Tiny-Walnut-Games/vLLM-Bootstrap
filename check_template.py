from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-3.2-1B')
if hasattr(tokenizer, 'chat_template') and tokenizer.chat_template:
    print("Chat template found:")
    print(tokenizer.chat_template)
else:
    print("No chat template in tokenizer")
