import re

with open('src/components/airbnb/AirbnbDesktopMarketplace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update props interface
props_search = "export interface AirbnbDesktopMarketplaceProps {"
props_replace = "export interface AirbnbDesktopMarketplaceProps {\n  promos?: any[];"
content = content.replace(props_search, props_replace)

# Update component arguments
func_search = "export function AirbnbDesktopMarketplace({"
func_replace = "export function AirbnbDesktopMarketplace({\n  promos = [],"
content = content.replace(func_search, func_replace)

# Pass to HowItWorksSection
how_it_works_search = "<HowItWorksSection />"
how_it_works_replace = "<HowItWorksSection promos={promos} />"
content = content.replace(how_it_works_search, how_it_works_replace)

with open('src/components/airbnb/AirbnbDesktopMarketplace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
