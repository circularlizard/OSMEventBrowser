"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OSMSection } from "@/lib/osm-data-helpers";

interface SectionSelectorProps {
    sections: OSMSection[];
    selectedSectionId: string | null;
    onSectionChange: (sectionId: string) => void;
}

export function SectionSelector({
    sections,
    selectedSectionId,
    onSectionChange,
}: SectionSelectorProps) {
    if (sections.length === 0) {
        return (
            <div className="text-sm text-muted-foreground">
                No sections available
            </div>
        );
    }

    return (
        <Select value={selectedSectionId || undefined} onValueChange={onSectionChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
                {sections.map((section) => (
                    <SelectItem key={section.sectionId} value={section.sectionId}>
                        <div className="flex flex-col">
                            <span className="font-medium">{section.sectionName}</span>
                            <span className="text-xs text-muted-foreground">
                                {section.groupName}
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
