import re

with open('src/components/airbnb/AirbnbVendorDetailView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_src = "src={https://maps.google.com/maps?q=&t=&z=13&ie=UTF8&iwloc=&output=embed}"
good_src = "src={`https://maps.google.com/maps?q=${encodeURIComponent(vendor.location || 'Maharashtra, India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}"

content = content.replace(bad_src, good_src)

with open('src/components/airbnb/AirbnbVendorDetailView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
