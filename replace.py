import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<a[^>]+href=\{https://wa\.me/91\$\{b\.customerPhone\.replace[^>]+>\s*💬 WhatsApp\s*</a>',
    r'''<button onClick={() => { setActiveTab('chat'); }} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm">💬 Message Customer</button>''',
    content,
    flags=re.MULTILINE
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
