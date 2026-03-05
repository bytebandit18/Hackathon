const fs = require('fs');

const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `      {/* Developer Contact Details */}
      <div className="w-full rounded-2xl bg-card p-4">
        <h3 className="block text-sm font-bold text-foreground mb-3">
          Contact Support
        </h3>
        <div className="flex flex-col gap-3">
          <a
            href="tel:+1234567890"
            className="flex items-center justify-between rounded-xl bg-background px-4 py-3 border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/5 active:scale-[0.98]"
            aria-label="Call support via phone"
          >
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Call Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
          <a
            href="https://instagram.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-background px-4 py-3 border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/5 active:scale-[0.98]"
            aria-label="Contact support on Instagram"
          >
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold">Instagram (@your_username)</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Replace placeholders with your real details in the code.
        </p>
      </div>`;

const repl1 = `      {/* Developer Contact Details */}
      <div className="w-full rounded-2xl bg-card p-6 border-2 border-border shadow-md">
        <h3 className="block text-center text-sm font-bold text-foreground mb-4 tracking-widest uppercase">
          Contact Details
        </h3>
        <div className="flex flex-row justify-center gap-4">
          <a
            href="tel:+919876543210"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 shadow-sm hover:shadow-primary/20"
            aria-label="Call support via phone"
          >
            <Phone className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://instagram.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 shadow-sm hover:shadow-primary/20"
            aria-label="Contact support on Instagram"
          >
            <Instagram className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://twitter.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 shadow-sm hover:shadow-primary/20"
            aria-label="Contact support on Twitter"
          >
            <Twitter className="h-6 w-6 text-primary" />
          </a>
          <a
            href="https://facebook.com/your_username"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-border focus:border-primary text-foreground transition-all hover:bg-primary/20 hover:border-primary active:scale-95 shadow-sm hover:shadow-primary/20"
            aria-label="Contact support on Facebook"
          >
            <Facebook className="h-6 w-6 text-primary" />
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground opacity-60">
          Reach out on social media or direct call
        </p>
      </div>`;

let success = false;
if (content.includes(target1)) {
    content = content.replace(target1, repl1);
    success = true;
    console.log("REPLACED T1 EXACtly");
} else {
    // try removing the new line matching issue if any
    const regex1 = /\{\/\*\s*Developer Contact Details\s*\*\/\}.*?Replace placeholders with your real details in the code\.\s*<\/p>\s*<\/div>/gs;
    if (regex1.test(content)) {
        content = content.replace(regex1, repl1.trim());
        success = true;
        console.log("REPLACED by custom regex");
    } else {
        console.log("NOT FOUND T1");
    }
}

// Ensure Imports
const impMatch = /import\s+\{[^}]*\}\s+from\s+"lucide-react"/;
const curImp = content.match(impMatch);
if (curImp) {
    let impStr = curImp[0];
    if (!impStr.includes('Twitter')) impStr = impStr.replace('}', ', Twitter, Facebook }');
    content = content.replace(curImp[0], impStr);
}


if (success) {
    fs.writeFileSync(path, content, 'utf8');
    console.log("FILE WRITTEN");
}
