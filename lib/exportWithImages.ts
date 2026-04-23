/**
 * Export bugs with images
 * Creates a ZIP file containing CSV data and all screenshots
 */

import JSZip from 'jszip';

export interface BugExportData {
    _id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    category?: string;
    assigneeId?: string;
    reporterName?: string;
    reporterEmail?: string;
    createdAt: number;
    url?: string;
    browser?: string;
    os?: string;
    screenWidth?: number;
    screenHeight?: number;
    description?: string;
    consoleErrors?: string[];
    screenshotUrl?: string;
    tags?: string[];
}

/**
 * Export bugs to ZIP with CSV and images
 */
export async function exportBugsWithImages(
    bugs: BugExportData[],
    projectName: string,
    memberMap: Record<string, string> = {}
): Promise<void> {
    const zip = new JSZip();

    // Create CSV content
    const headers = [
        "ID", "Title", "Status", "Priority", "Type", "Category", "Assignee",
        "Reporter Name", "Reporter Email", "Created At", "URL", "Browser", "OS",
        "Screen Size", "Description", "Console Errors", "Tags", "Screenshot File"
    ];

    const rows = bugs.map((bug, index) => {
        const screenshotFileName = bug.screenshotUrl 
            ? `screenshot_${index + 1}_${bug._id}.png` 
            : "";

        return [
            bug._id,
            bug.title,
            bug.status,
            bug.priority,
            bug.type || "general",
            bug.category || "None",
            bug.assigneeId ? (memberMap[bug.assigneeId] || bug.assigneeId) : "Unassigned",
            bug.reporterName || "Widget",
            bug.reporterEmail || "N/A",
            new Date(bug.createdAt).toLocaleString(),
            bug.url || "N/A",
            bug.browser || "N/A",
            bug.os || "N/A",
            bug.screenWidth ? `${bug.screenWidth}x${bug.screenHeight}` : "N/A",
            (bug.description || "").replace(/\n/g, " "),
            (bug.consoleErrors || []).join(" | "),
            (bug.tags || []).join(", "),
            screenshotFileName
        ];
    });

    // Build CSV string
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(","))
    ].join("\n");

    // Add CSV to ZIP
    zip.file("bugs.csv", csvContent);

    // Create README
    const readme = `# BugScribe Export
Project: ${projectName}
Exported: ${new Date().toLocaleString()}
Total Bugs: ${bugs.length}

## Contents
- bugs.csv: Complete bug data in CSV format
- screenshots/: All bug screenshots (if available)

## CSV Columns
${headers.join(", ")}

## Notes
- Screenshots are named: screenshot_[number]_[bugId].png
- The "Screenshot File" column in CSV references the image filename
- Import this data using BugScribe's import feature
`;

    zip.file("README.txt", readme);

    // Download screenshots and add to ZIP
    const screenshotsFolder = zip.folder("screenshots");
    if (screenshotsFolder) {
        let downloadedCount = 0;
        
        for (let i = 0; i < bugs.length; i++) {
            const bug = bugs[i];
            if (bug.screenshotUrl) {
                try {
                    // Fetch the image
                    const response = await fetch(bug.screenshotUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const fileName = `screenshot_${i + 1}_${bug._id}.png`;
                        screenshotsFolder.file(fileName, blob);
                        downloadedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to download screenshot for bug ${bug._id}:`, error);
                }
            }
        }

        console.log(`Downloaded ${downloadedCount} of ${bugs.filter(b => b.screenshotUrl).length} screenshots`);
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
    });

    // Download ZIP
    const link = document.createElement("a");
    const url = URL.createObjectURL(zipBlob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download", 
        `bugscribe-export-${projectName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}.zip`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export bugs to CSV only (faster, no images)
 */
export function exportBugsToCSV(
    bugs: BugExportData[],
    projectName: string,
    memberMap: Record<string, string> = {}
): void {
    const headers = [
        "ID", "Title", "Status", "Priority", "Type", "Category", "Assignee",
        "Reporter Name", "Reporter Email", "Created At", "URL", "Browser", "OS",
        "Screen Size", "Description", "Console Errors", "Tags", "Screenshot URL"
    ];

    const rows = bugs.map(bug => [
        bug._id,
        bug.title,
        bug.status,
        bug.priority,
        bug.type || "general",
        bug.category || "None",
        bug.assigneeId ? (memberMap[bug.assigneeId] || bug.assigneeId) : "Unassigned",
        bug.reporterName || "Widget",
        bug.reporterEmail || "N/A",
        new Date(bug.createdAt).toLocaleString(),
        bug.url || "N/A",
        bug.browser || "N/A",
        bug.os || "N/A",
        bug.screenWidth ? `${bug.screenWidth}x${bug.screenHeight}` : "N/A",
        (bug.description || "").replace(/\n/g, " "),
        (bug.consoleErrors || []).join(" | "),
        (bug.tags || []).join(", "),
        bug.screenshotUrl || "N/A"
    ]);

    // Build CSV string
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download", 
        `bugscribe-export-${projectName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
