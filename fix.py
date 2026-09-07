import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''                        <span className={	ext-[10px] font-bold px-2.5 py-1 rounded-full }>
                          {b.status === 'Pending' ? 'Awaiting Confirmation' : b.status}
                            </span>
                            <button onClick={() => setActiveTab('chat')} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold mt-2 py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm">💬 Message Vendor</button>
                        </span>''',
'''                        <div className="flex flex-col items-end">
                          <span className={	ext-[10px] font-bold px-2.5 py-1 rounded-full }>
                            {b.status === 'Pending' ? 'Awaiting Confirmation' : b.status}
                          </span>
                          <button onClick={() => setActiveTab('chat')} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold mt-2 py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 transition shadow-sm">💬 Message Vendor</button>
                        </div>'''
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
