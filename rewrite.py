import sys

def proceed():
    with open('app/page.tsx', 'r') as f:
        data = f.read()

    marker1 = "{/* Developer Contact Details */}"
    marker2 = "{/* Voice commands */}"

    if marker1 not in data or marker2 not in data:
        print("Cannot find markers")
        return

    idx1 = data.find(marker1)
    idx2 = data.find(marker2)

    if idx2 <= idx1:
        print("Marker 2 is before marker 1!")
        return

    # find import
    imp_idx = data.find('from "lucide-react"')
    if imp_idx >= 0:
        imp_line_start = data.rfind("import {", 0, imp_idx)
        imp_line_end = data.find("}", imp_line_start)
        imp_line = data[imp_line_start:imp_line_end]
        if "Twitter" not in imp_line:
            data = data[:imp_line_end] + ", Twitter, Facebook " + data[imp_line_end:]
            # update indices because data changed
            idx1 = data.find(marker1)
            idx2 = data.find(marker2)

    part1 = data[:idx1]
    part2 = data[idx2:]

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

    new_data = part1 + repl + part2

    with open('app/page.tsx', 'w') as f:
        f.write(new_data)
        print("Success! Replaced block fully.")

proceed()
