import os

file_path = r'c:\Users\goodp\OneDrive\AITechHubSmartTechnologyPlatform\frontend\src\features\code-studio\LivePreview.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add missing </div> for the first metric card (after "34.2 ms" line)
old1 = '<p className="text-sm font-bold text-[#6046F5] mt-0.5">34.2 ms</p>\n          <div className="rounded-xl border border-[#1E2C48] bg-[#111D34] p-3 text-center">'
new1 = '<p className="text-sm font-bold text-[#6046F5] mt-0.5">34.2 ms</p>\n          </div>\n          <div className="rounded-xl border border-[#1E2C48] bg-[#111D34] p-3 text-center">'
if old1 in content:
    content = content.replace(old1, new1, 1)
    print('Fixed metric card 1 closing')
else:
    print('Pattern not found for metric card 1')

# Fix 2: Add missing </div> for the second metric card (after "92.4 tps" line)
old2 = '<p className="text-sm font-bold text-emerald-400 mt-0.5">92.4 tps</p>\n          <div className="rounded-xl border border-[#1E2C48] bg-[#111D34] p-3 text-center">'
new2 = '<p className="text-sm font-bold text-emerald-400 mt-0.5">92.4 tps</p>\n          </div>\n          <div className="rounded-xl border border-[#1E2C48] bg-[#111D34] p-3 text-center">'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Fixed metric card 2 closing')
else:
    print('Pattern not found for metric card 2')

# Fix 3: Add missing </div> for the table (after </table> line, before the return )
old3 = '          </table>\n    );'
new3 = '          </table>\n        </div>\n    );'
if old3 in content:
    content = content.replace(old3, new3, 1)
    print('Fixed table closing')
else:
    print('Pattern not found for table')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully!')
