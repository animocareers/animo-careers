import { Link } from "@/i18n/navigation";

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: React.ReactNode;
}

export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <div className="flex min-h-svh">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-mesh" />
        <Link
          href="/"
          className="relative z-10 text-2xl font-heading font-black"
        >
          Animo
        </Link>
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-4xl font-heading font-black tracking-tight text-balance">
            {heading}
          </h1>
          <p className="text-lg text-primary-foreground/80 text-balance">
            {subheading}
          </p>
        </div>
        <div />
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-block text-2xl font-heading font-black text-gradient lg:hidden"
          >
            animo
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
