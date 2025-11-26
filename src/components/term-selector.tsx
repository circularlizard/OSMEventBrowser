"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OSMTerm } from "@/lib/osm-data-helpers";

interface TermSelectorProps {
    terms: OSMTerm[];
    selectedTermId: string | null;
    onTermChange: (termId: string) => void;
}

export function TermSelector({
    terms,
    selectedTermId,
    onTermChange,
}: TermSelectorProps) {
    if (terms.length === 0) {
        return (
            <div className="text-sm text-muted-foreground">
                No terms available for this section
            </div>
        );
    }

    // Sort terms by start date (newest first)
    const sortedTerms = [...terms].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    return (
        <Select value={selectedTermId || undefined} onValueChange={onTermChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a term" />
            </SelectTrigger>
            <SelectContent>
                {sortedTerms.map((term) => (
                    <SelectItem key={term.termId} value={term.termId}>
                        <div className="flex items-center gap-2">
                            <span>{term.name}</span>
                            {!term.isPast && (
                                <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    Current
                                </span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
