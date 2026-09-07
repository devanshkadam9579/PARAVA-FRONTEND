import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pass promos to AirbnbDesktopMarketplace
target = """<AirbnbDesktopMarketplace
          vendors={vendors}"""
replacement = """<AirbnbDesktopMarketplace
          promos={promosList}
          vendors={vendors}"""
content = content.replace(target, replacement)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
