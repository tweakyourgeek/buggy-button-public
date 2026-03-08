import BugWidget from "@/components/BugWidget";
import { Link } from "react-router-dom";

const Index = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Bug Report Widget</h1>
      <p className="text-muted-foreground">
        Click the <span className="font-semibold text-bug-accent">bug icon</span> in the bottom-right corner to report a bug.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Embed anywhere:&nbsp;
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {'<iframe src="/widget" style="position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;pointer-events:none;" allow="clipboard-write" />'}
        </code>
      </p>
      <Link to="/admin" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Go to Admin Dashboard →
      </Link>
    </div>
    <BugWidget />
  </div>
);

export default Index;
