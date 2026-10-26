import os

file_path = r'c:\Users\goodp\OneDrive\AITechHubSmartTechnologyPlatform\frontend\src\features\code-studio\LivePreview.jsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the section starting from 'mobileMenuOpen && ('
content = ''.join(lines)
idx = content.find('mobileMenuOpen && (')
if idx >= 0:
    # Find where this section ends (the return statement)
    end_idx = content.find('\n    );', idx)
    if end_idx >= 0:
        # The section includes everything from mobileMenuOpen to the end of the return
        section = content[idx:end_idx + len('\n    );')]
        
        # Find all occurrences of '</div>' in this section
        div_positions = [m.start() for m in __import__('re').finditer('</div>', section)]
        print(f"Found {len(div_positions)} closing divs at positions: {div_positions}")
        
        # The structure should be:
        # - div1 opened at line 313 (2 spaces + '<div' after the opening 4 spaces + '<div')
        # - div2 opened at line 314 (4 spaces + '<div' after the opening 6 spaces + '<div')
        # - mobile menu div is self-contained (opened and closed within conditional)
        # - div3 opened on line 365 (inside div1 at the same level as div2)
        # - div2 closed on line 363 (should be)
        # - div3 closed on line 368 (should be)
        # - div1 closed on line 369 (should be)
        # - extra </div> on line 370 (should be removed)
        # - extra </div> on line 371 (should be removed)
        
        # The return statement ends at end_idx
        # We need to keep: div1 open, div2 open, div3 open, then close div3, div1, return
        # Currently we have: div1 open, div2 open, ..., div3 open, div3 close, div1 close, div2 close (extra), div3 close (extra), return
        
        # Strategy: Find and remove the extra closing divs
        # There should be exactly 2 divs opened before the closing tags
        # Let's count: we see 6 closing divs but only 2 opening divs (div1 and div2)
        
        # The correct structure should have 4 closing divs (div2, div3, div1, and one for the return)
        # Actually let me count more carefully:
        # Line 313: div1 opened (1 open)
        # Line 314: div2 opened (2 opens)
        # Line 363: div2 closed (1 open remaining)
        # Line 368: div3 closed (1 open remaining)
        # Line 369: div1 closed (0 opens remaining)
        # Line 370: div2 closed (extra - wrong!)
        # Line 371: div3 closed (extra - wrong!)
        
        # So we need to remove lines 370 and 371 (the two extra closing divs)
        
        # Find the exact positions of the closing divs in the full content
        # Start after the mobile menu closing)
        # The mobile menu closes at position end_idx (the ')}' at end_idx-1 or so)
        
        # Let's get the content after the mobile menu close
        mobile_menu_close = end_idx  # This is where the content starts after mobile menu
        closing_divs = [m.start() for m in __import__('re').finditer('</div>', content[mobile_menu_close:])]
        print(f"Closing divs after mobile menu: {closing_divs}")
        
        # Find the context around each closing div
        for i, pos in enumerate(closing_divs):
            start = max(0, pos - 50)
            end = min(len(content), pos + 50)
            print(f"\nClosing div {i+1} at position {pos}:")
            print(repr(content[start:end]))
            
        # The extra closing divs are the 2nd and 3rd ones (not the first)
        # Actually, let me reconsider
        # First closing div: closes div2 (correct)
        # Second closing div: closes div3 (correct) 
        # Third closing div: closes div1 (correct)  
        # Fourth closing div: EXTRA (should be removed)
        # Fifth closing div: EXTRA (should be removed)
        
        # So we need to remove the 4th and 5th closing divs
        if len(closing_divs) >= 5:
            # Get the exact line numbers
            for i in [3, 4]:  # 1-indexed: 4th and 5th closing divs (index 3 and 4)
                pos = closing_divs[i]
                start = max(0, pos - 100)
                end = min(len(content), pos + 30)
                print(f"\nRemoving closing div {i+1}:")
                print(repr(content[start:end]))
                
                # Replace this </div> with something unique for identification
                # Actually, let's just remove the extra closing divs
                if i >= 3:  # 4th and 5th closing divs (0-indexed)
                    pass  # We'll remove them
