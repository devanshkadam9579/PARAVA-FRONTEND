import re

with open('src/components/airbnb/AirbnbNavbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Users, ChevronDown, Check', 'Users, ChevronDown, Check, Search')

with open('src/components/airbnb/AirbnbNavbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
