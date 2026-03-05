import re

with open('app/page.tsx', 'r') as f:
    orig = f.read()

target = r"""      \{/\* Developer Contact Details \*/}
      <div className="w-full rounded-2xl bg-card p-[46] border-2 border-border.*?>
        <h3.*?Contact Details.*?</h3>
        <div className="flex flex-[^\"]*?justify-center gap-[4]\{?\}?.*?>.*?<a.*?<Phone.*?</a>\n.*?<a.*?<Instagram.*?</a>.*?</div>\s*<p.*?>.*?</p>\n\s*</div>\{\s*\}"""

# Fallback pattern, find EXACTLY what's there simply bypassing re limits:
