import re

with open('app/page.tsx', 'r') as f:
    orig = f.read()

target = r"""      \{/\* Developer Contact Details \*/\}
      <div className="w-full rounded-2xl bg-card p-4">
        <h3 className="block text-sm font-bold text-foreground mb-3">
          Contact Support
        </h3>
        <div className="flex flex-col gap-3">
          <a
            href="tel:\+1234567890"
            className="flex items-center justify-between rounded-xl bg-background px-4 py-3 border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/5 active:scale-\[0\.98\]"
            aria-label="Call support via phone"
          >
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Call Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
          <a
            href="https://instagram\.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-background px-4 py-3 border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/5 active:scale-\[0\.98\]"
            aria-label="Contact support on Instagram"
          >
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Instagram \(@your_username\)</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Replace placeholders with your real details in the code\.
        </p>
      </div>"""

repl = """      {/* Developer Contact Details */}
      <div className="w-full rounded-2xl bg-card p-6 border-2 border-border shadow-md">
        <h3 className="block text-center text-sm font-bold text-foreground mb-4 tracking-widest uppercase">
          Contact Details
        </h3>
        <div className="flex flex-row justify-center gap-4">
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
          Reach out on social media or direct call
        </p>
      </div>"""

res, n = re.subn(target, repl, orig)
if n > 0:
    with open('app/page.tsx', 'w') as f:
        f.write(res)
    print("Success")
else:
    print("Failed to match")
