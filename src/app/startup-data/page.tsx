import { getStartupData } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StartupDataPage() {
    const startupData = await getStartupData();

    if (!startupData) {
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">
                    OSM Startup Data
                </h1>
                <a
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to Dashboard
                </a>
            </div>

            <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">User Information</h2>
                <div className="space-y-2 text-sm">
                    <p>
                        <strong>User ID:</strong> {startupData.globals?.userid}
                    </p>
                    <p>
                        <strong>Name:</strong> {startupData.globals?.fullname}
                    </p>
                    <p>
                        <strong>Email:</strong> {startupData.globals?.email}
                    </p>
                </div>
            </div>

            {startupData.globals?.roles && (
                <div className="rounded-lg border p-6">
                    <h2 className="mb-4 text-xl font-semibold">
                        Sections ({startupData.globals.roles.length})
                    </h2>
                    <div className="space-y-4">
                        {startupData.globals.roles.map((role: any, index: number) => (
                            <div
                                key={index}
                                className="rounded-md border bg-muted/50 p-4"
                            >
                                <h3 className="font-semibold">
                                    {role.sectionname}
                                    {role.isDefault === "1" && (
                                        <span className="ml-2 text-xs text-primary">
                                            (Default)
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {role.groupname} - {role.section}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    {Object.entries(role.permissions || {}).map(
                                        ([key, value]) =>
                                            value !== 0 && (
                                                <span
                                                    key={key}
                                                    className="rounded bg-primary/10 px-2 py-1"
                                                >
                                                    {key}: {value}
                                                </span>
                                            )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">Raw Data</h2>
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
                    {JSON.stringify(startupData, null, 2)}
                </pre>
            </div>
        </div>
    );
}
