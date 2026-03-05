import re

with open('app/page.tsx', 'r') as f:
    orig = f.read()

# Ensure lucide-react has Twitter, Facebook
imp_start = orig.find('lucide-react')
if imp_start > -1:
    imp_line_start = orig.rfind("import {", 0, imp_start)
    imp_line_end = orig.find('}', imp_line_start)
    imp_line = orig[imp_line_start:imp_line_end]
    if 'Twitter' not in imp_line:
        orig = orig[:imp_line_end] + ', Twitter, Facebook ' + orig[imp_line_end:]

part1 = orig.split('{/* Developer Contact Details */}')[0]
part2 = orig.split('{/* Voice commands */}')[1]

repl = """{/* Developer Contact Details */}
      <div className="w-full rounded-2xl bg-card p-6 border-2 border-border shadow-md">
        <h3 className="block text-center text-sm font-bold text-foreground mb-4 tracking-widest uppercase">
          Contact Details
        </h3>
        <div className="flex flex-row flex-wrap justify-center gap-4">
          <a
            href="tel:+919876543210"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 hover:-translate-y-1 shadow-sm"
            aria-label="Call support via phone"
          >
            <Phone className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://instagram.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 hover:-translate-y-1 shadow-sm"
            aria-label="Contact support on Instagram"
          >
            <Instagram className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://twitter.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 hover:-translate-y-1 shadow-sm"
            aria-label="Contact support on Twitter"
          >
            <Twitter className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://facebook.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 hover:-translate-y-1 shadow-sm"
            aria-label="Contact support on Facebook"
          >
            <Facebook className="h-6 w-6 text-primary" />
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground opacity-80">
          Reach out on social media or direct call.
        </p>
      </div>

      """

new_content = part1 + repl + '{/* Voice commands */}'+ part2

with open('app/page.tsx', 'w') as f:
    f.write(new_content)
print("done")
