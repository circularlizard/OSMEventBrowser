import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        redirect("/?error=not_authenticated");
    }

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground">
                You are successfully authenticated with OSM!
            </p>
            <form action="/api/logout" method="POST">
                <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Logout
                </button>
            </form>
        </div>
    );
}
