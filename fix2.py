import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the closing span and extra buttons correctly
pattern = r'(?s)                        \}\}>\s*\{b\.status === ''Pending'' \? ''Awaiting Confirmation'' : b\.status\}\s*</span>\s*<button onClick=\{\(\) => setActiveTab\(''chat''\)\} className="[^"]+">\S*\s*Message Vendor</button>\s*</span>'

replacement = r'''                        }}>
                          {b.status === 'Pending' ? 'Awaiting Confirmation' : b.status}
                        </span>
                        <button onClick={() => setActiveTab('chat')} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold mt-2 py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm">💬 Message Vendor</button>
                      </div>'''

content = re.sub(pattern, replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed with regex")
