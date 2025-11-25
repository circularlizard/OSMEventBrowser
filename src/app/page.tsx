import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authenticated = await isAuthenticated();
  const params = await searchParams;

  if (authenticated) {
    redirect("/dashboard");
  }

  const getOAuthUrl = () => {
    const baseUrl = process.env.OSM_API_BASE_URL;
    const clientId = process.env.OSM_CLIENT_ID;
    const redirectUri = process.env.OSM_REDIRECT_URI;

    return `${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri!
    )}&response_type=code&scope=section:event:read section:member:read`;
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-primary">OSM Event Browser</h1>
        <p className="max-w-md text-muted-foreground">
          Connect to Online Scout Manager to browse and manage your events.
        </p>
      </div>

      {params.error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p>
            <strong>Error:</strong> {params.error.replace(/_/g, " ")}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <a href={getOAuthUrl()}>Sign in with OSM</a>
        </Button>
        <p className="text-xs text-muted-foreground">
          You will be redirected to Online Scout Manager to authorize this app.
        </p>
      </div>
    </div>
  );
}
