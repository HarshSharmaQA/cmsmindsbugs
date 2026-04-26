/**
 * Export bugs with images
 * Creates a ZIP file containing CSV data and all screenshots
 */

import JSZip from 'jszip';

export interface BugExportData {
    _id: string;
    issueNumber?: number;
    title: string;
    status: string;
    priority: string;
    type: string;
    category?: string;
    assigneeId?: string;
    assigneeName?: string;
    assigneeEmail?: string;
    reporterName?: string;
    reporterEmail?: string;
    createdAt: number;
    updatedAt?: number;
    url?: string;
    browser?: string;
    os?: string;
    screenWidth?: number;
    screenHeight?: number;
    description?: string;
    consoleErrors?: string[];
    networkLogs?: string[];
    screenshotUrl?: string;
    mediaType?: string;
    tags?: string[];
    dueDate?: number;
    estimatedHours?: number;
    actualHours?: number;
    x_coordinate?: number;
    y_coordinate?: number;
    scroll_position?: number;
    element_selector?: string;
}

/**
 * Export bugs to ZIP with CSV and images
 */
export async function exportBugsWithImages(
    bugs: BugExportData[],
    projectName: string,
    memberMap: Record<string, { name?: string; email?: string }> = {}
): Promise<void> {
    const zip = new JSZip();

    // Create comprehensive CSV content with all fields
    const headers = [
        "Issue Number", "ID", "Title", "Status", "Priority", "Type", "Category",
        "Assignee Name", "Assignee Email", "Assignee ID",
        "Reporter Name", "Reporter Email",
        "Created At", "Updated At", "Due Date",
        "URL", "Browser", "OS", "Screen Size",
        "Description", "Console Errors", "Network Logs",
        "Tags", "Estimated Hours", "Actual Hours",
        "X Coordinate", "Y Coordinate", "Scroll Position", "Element Selector",
        "Media Type", "Screenshot File"
    ];

    const rows = bugs.map((bug, index) => {
        const screenshotFileName = bug.screenshotUrl 
            ? `screenshot_${bug.issueNumber || index + 1}_${bug._id}.${bug.mediaType === 'video' ? 'mp4' : 'png'}` 
            : "";

        const assignee = bug.assigneeId ? memberMap[bug.assigneeId] : null;

        return [
            bug.issueNumber || index + 1,
            bug._id,
            bug.title,
            bug.status,
            bug.priority,
            bug.type || "general",
            bug.category || "",
            bug.assigneeName || assignee?.name || "",
            bug.assigneeEmail || assignee?.email || "",
            bug.assigneeId || "",
            bug.reporterName || "Widget",
            bug.reporterEmail || "",
            new Date(bug.createdAt).toISOString(),
            bug.updatedAt ? new Date(bug.updatedAt).toISOString() : "",
            bug.dueDate ? new Date(bug.dueDate).toISOString() : "",
            bug.url || "",
            bug.browser || "",
            bug.os || "",
            bug.screenWidth ? `${bug.screenWidth}x${bug.screenHeight}` : "",
            (bug.description || "").replace(/\n/g, " ").replace(/\r/g, ""),
            (bug.consoleErrors || []).join(" | "),
            (bug.networkLogs || []).join(" | "),
            (bug.tags || []).join(", "),
            bug.estimatedHours || "",
            bug.actualHours || "",
            bug.x_coordinate || "",
            bug.y_coordinate || "",
            bug.scroll_position || "",
            bug.element_selector || "",
            bug.mediaType || "image",
            screenshotFileName
        ];
    });

    // Build CSV string with proper escaping
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
            const str = String(val);
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(","))
    ].join("\n");

    // Add CSV to ZIP
    zip.file("bugs.csv", csvContent);

    // Create comprehensive README
    const readme = `# BugScribe Export - Complete Package
Project: ${projectName}
Exported: ${new Date().toLocaleString()}
Total Bugs: ${bugs.length}
Bugs with Screenshots: ${bugs.filter(b => b.screenshotUrl).length}

## 📦 Contents
- bugs.csv: Complete bug data in CSV format with all fields
- screenshots/: All bug screenshots and screen recordings
- README.txt: This file

## 📊 CSV Columns
${headers.join("\n- ")}

## 🖼️ Screenshots
- Images are named: screenshot_[issueNumber]_[bugId].png
- Videos are named: screenshot_[issueNumber]_[bugId].mp4
- The "Screenshot File" column in CSV references the filename
- The "Media Type" column indicates if it's an image or video

## 📥 Import Instructions
1. Use BugScribe's import feature to upload the CSV file
2. Screenshots will be referenced by filename
3. Assignees will be matched by email if they exist in the project
4. All metadata including coordinates, tags, and timestamps will be preserved

## 🔧 Field Descriptions
- Issue Number: Sequential issue number within the project
- Assignee fields: Person responsible for fixing the bug
- Reporter fields: Person who reported the bug
- Coordinates: X, Y position and scroll for visual highlighting
- Element Selector: CSS selector for the affected element
- Estimated/Actual Hours: Time tracking information
- Console Errors: JavaScript errors captured at time of report
- Network Logs: Network requests captured at time of report

## 💡 Tips
- Import the CSV first to create bug records
- Screenshots are automatically linked by filename
- Tags are comma-separated and will be parsed on import
- Dates are in ISO 8601 format for universal compatibility
- Empty fields are preserved as empty strings

---
Generated by BugScribe Export Tool
https://bugscribe.com
`;

    zip.file("README.txt", readme);

    // Download screenshots and videos, add to ZIP
    const screenshotsFolder = zip.folder("screenshots");
    if (screenshotsFolder) {
        let downloadedCount = 0;
        let failedCount = 0;
        
        console.log(`Starting download of ${bugs.filter(b => b.screenshotUrl).length} media files...`);
        
        for (let i = 0; i < bugs.length; i++) {
            const bug = bugs[i];
            if (bug.screenshotUrl) {
                try {
                    // Fetch the media file
                    const response = await fetch(bug.screenshotUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const extension = bug.mediaType === 'video' ? 'mp4' : 'png';
                        const fileName = `screenshot_${bug.issueNumber || i + 1}_${bug._id}.${extension}`;
                        screenshotsFolder.file(fileName, blob);
                        downloadedCount++;
                        
                        // Log progress every 10 files
                        if (downloadedCount % 10 === 0) {
                            console.log(`Downloaded ${downloadedCount} files...`);
                        }
                    } else {
                        console.warn(`Failed to download media for bug ${bug._id}: HTTP ${response.status}`);
                        failedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to download media for bug ${bug._id}:`, error);
                    failedCount++;
                }
            }
        }

        console.log(`✓ Downloaded ${downloadedCount} of ${bugs.filter(b => b.screenshotUrl).length} media files`);
        if (failedCount > 0) {
            console.warn(`⚠ Failed to download ${failedCount} media files`);
        }
    }

    // Generate ZIP file with progress
    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
    }, (metadata) => {
        // Progress callback
        console.log(`ZIP Progress: ${metadata.percent.toFixed(1)}%`);
    });

    console.log('✓ ZIP file generated successfully');

    // Download ZIP
    const link = document.createElement("a");
    const url = URL.createObjectURL(zipBlob);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `bugscribe-export-${projectName.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.zip`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✓ Export complete: ${filename}`);
}

/**
 * Export bugs to CSV only (faster, no images)
 */
export function exportBugsToCSV(
    bugs: BugExportData[],
    projectName: string,
    memberMap: Record<string, { name?: string; email?: string }> = {}
): void {
    const headers = [
        "Issue Number", "ID", "Title", "Status", "Priority", "Type", "Category",
        "Assignee Name", "Assignee Email", "Assignee ID",
        "Reporter Name", "Reporter Email",
        "Created At", "Updated At", "Due Date",
        "URL", "Browser", "OS", "Screen Size",
        "Description", "Console Errors", "Network Logs",
        "Tags", "Estimated Hours", "Actual Hours",
        "Screenshot URL", "Media Type"
    ];

    const rows = bugs.map((bug, index) => {
        const assignee = bug.assigneeId ? memberMap[bug.assigneeId] : null;

        return [
            bug.issueNumber || index + 1,
            bug._id,
            bug.title,
            bug.status,
            bug.priority,
            bug.type || "general",
            bug.category || "",
            bug.assigneeName || assignee?.name || "",
            bug.assigneeEmail || assignee?.email || "",
            bug.assigneeId || "",
            bug.reporterName || "Widget",
            bug.reporterEmail || "",
            new Date(bug.createdAt).toISOString(),
            bug.updatedAt ? new Date(bug.updatedAt).toISOString() : "",
            bug.dueDate ? new Date(bug.dueDate).toISOString() : "",
            bug.url || "",
            bug.browser || "",
            bug.os || "",
            bug.screenWidth ? `${bug.screenWidth}x${bug.screenHeight}` : "",
            (bug.description || "").replace(/\n/g, " ").replace(/\r/g, ""),
            (bug.consoleErrors || []).join(" | "),
            (bug.networkLogs || []).join(" | "),
            (bug.tags || []).join(", "),
            bug.estimatedHours || "",
            bug.actualHours || "",
            bug.screenshotUrl || "",
            bug.mediaType || "image"
        ];
    });

    // Build CSV string with proper escaping
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
            const str = String(val);
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `bugscribe-export-${projectName.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✓ CSV export complete: ${filename}`);
}
