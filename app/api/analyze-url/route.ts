import { NextResponse } from 'next/server';
import { convert } from 'html-to-text';
import { chromium } from 'playwright-core';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds for analysis + screenshot

async function getDetailedAnalysis(url: string) {
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        
        // Detailed element extraction
        const pageDetails = await page.evaluate(() => {
            const getLabels = (el: HTMLElement) => {
                const labels = [];
                if (el.id) {
                    const labelElements = document.querySelectorAll(`label[for="${el.id}"]`);
                    labelElements.forEach(l => labels.push(l.textContent?.trim()));
                }
                const parentLabel = el.closest('label');
                if (parentLabel) labels.push(parentLabel.textContent?.trim());
                return labels.filter(Boolean);
            };

            return {
                title: document.title,
                h1: document.querySelector('h1')?.textContent?.trim() || '',
                navLinks: Array.from(document.querySelectorAll('nav a, header a')).map(a => a.textContent?.trim()).filter(Boolean).slice(0, 10),
                dropdowns: Array.from(document.querySelectorAll('select')).map(select => ({
                    label: getLabels(select)[0] || select.name || (select as any).placeholder || 'Filter',
                    options: Array.from(select.options).map(o => o.text.trim()).filter(t => t && !t.toLowerCase().includes('select')).slice(0, 5)
                })),
                buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                    .map(b => (b instanceof HTMLInputElement ? b.value : b.textContent)?.trim())
                    .filter(Boolean).slice(0, 10),
                listItems: Array.from(document.querySelectorAll('li, [class*="item"], [class*="card"]'))
                    .map(i => i.textContent?.trim()?.substring(0, 100))
                    .filter(t => t && t.length > 20).slice(0, 5),
                searchInputs: Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="search" i]'))
                    .map(i => (i as HTMLInputElement).placeholder || 'Search')
            };
        });

        const buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
        const screenshot = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        return { ...pageDetails, screenshot };
    } catch (err) {
        console.error('Detailed analysis failed:', err);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Basic URL validation
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return NextResponse.json({ error: 'Only http and https protocols are supported' }, { status: 400 });
        }

        const analysis = await getDetailedAnalysis(url);
        
        if (!analysis) {
            return NextResponse.json({ error: 'Failed to analyze the page content' }, { status: 500 });
        }

        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error('Error analyzing URL:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
