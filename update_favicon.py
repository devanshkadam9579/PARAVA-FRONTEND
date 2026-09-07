import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" href="/parva-logo.png" />
    <link rel="apple-touch-icon" href="/parva-logo.png" />'''

content = re.sub(r'    <link rel="icon" type="image/png" href="/parva-logo\.png" />', replacement, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
