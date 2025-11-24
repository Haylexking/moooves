import json
with open('swagger.json', encoding='utf-8') as f:
    data=json.load(f)
paths=data.get('swaggerDoc',{}).get('paths',{})
for path,ops in paths.items():
    print(f"{path} -> {', '.join(ops.keys())}")
