export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 w-full">
      <div className="px-4 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with{" "}
            <a
              href="https://react.dev"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              React
            </a>
            ,{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              shadcn/ui
            </a>
            , and{" "}
            <a
              href="https://threejs.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Three.js
            </a>
            .
          </p>
        </div>
        <nav className="flex items-center space-x-4 text-sm">
          <a
            href="/privacy"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Terms
          </a>
          <a
            href="https://github.com/yourusername/chess-like"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
} 