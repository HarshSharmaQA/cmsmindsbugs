import { NextRequest, NextResponse } from 'next/server';

// Common bug description patterns and completions
const BUG_PATTERNS: Record<string, string[]> = {
    // UI/Visual
    'button': ['button is not clickable', 'button is missing', 'button text is incorrect', 'button alignment is off', 'button color is wrong', 'button not responding'],
    'text': ['text is truncated', 'text is overlapping', 'text is not visible', 'text alignment is wrong', 'text is missing', 'text color is incorrect'],
    'image': ['image is not loading', 'image is broken', 'image is distorted', 'image is missing', 'image size is incorrect', 'image is not responsive'],
    'layout': ['layout is broken on mobile', 'layout is misaligned', 'layout is overlapping', 'layout is not responsive', 'layout shifts on scroll'],
    'icon': ['icon is missing', 'icon is not aligned', 'icon is too small', 'icon is not visible', 'icon color is wrong'],
    'modal': ['modal is not closing', 'modal is not opening', 'modal is behind other elements', 'modal background is missing', 'modal content is cut off'],
    'dropdown': ['dropdown is not working', 'dropdown options are missing', 'dropdown is not closing', 'dropdown is misaligned', 'dropdown values are incorrect'],
    'form': ['form is not submitting', 'form validation is not working', 'form fields are not clearing', 'form data is not saving', 'form is not accessible'],
    'input': ['input field is not accepting text', 'input validation is incorrect', 'input placeholder is missing', 'input is not focused', 'input value is not saving'],
    'page': ['page is not loading', 'page is blank', 'page is not responsive', 'page title is incorrect', 'page is throwing an error', 'page scroll is broken'],
    'scroll': ['scroll is not working', 'scroll position resets', 'scroll is jumpy', 'infinite scroll is broken', 'scroll bar is missing'],
    'navigation': ['navigation is broken', 'navigation links are incorrect', 'navigation is not visible on mobile', 'navigation menu is not closing'],
    'header': ['header is overlapping content', 'header is not sticky', 'header links are broken', 'header is missing on mobile'],
    'footer': ['footer is not at the bottom', 'footer links are broken', 'footer is overlapping content'],
    'sidebar': ['sidebar is not collapsing', 'sidebar is overlapping content', 'sidebar is not visible', 'sidebar scroll is broken'],
    'table': ['table is not sortable', 'table data is incorrect', 'table is not responsive', 'table rows are misaligned', 'table pagination is broken'],
    'chart': ['chart is not rendering', 'chart data is incorrect', 'chart labels are missing', 'chart is not responsive', 'chart tooltip is broken'],
    'card': ['card layout is broken', 'card image is not loading', 'card content is overflowing', 'card hover effect is missing'],
    'color': ['color contrast is too low', 'color is not matching design', 'color changes on hover are missing', 'dark mode colors are incorrect'],
    'font': ['font is not loading', 'font size is incorrect', 'font weight is wrong', 'font is not consistent'],
    'spacing': ['spacing is inconsistent', 'padding is incorrect', 'margin is too large', 'elements are too close together'],
    'border': ['border is missing', 'border radius is incorrect', 'border color is wrong', 'border is too thick'],
    'shadow': ['shadow is missing', 'shadow is too strong', 'shadow color is incorrect'],
    'animation': ['animation is not working', 'animation is too slow', 'animation is causing layout shift', 'animation is not smooth'],
    'tooltip': ['tooltip is not showing', 'tooltip is misaligned', 'tooltip text is incorrect', 'tooltip is not dismissing'],
    'notification': ['notification is not showing', 'notification is not dismissing', 'notification position is wrong', 'notification content is incorrect'],
    'loading': ['loading spinner is missing', 'loading state is not showing', 'loading takes too long', 'loading indicator is stuck'],
    'error': ['error message is not showing', 'error message is incorrect', 'error state is not handled', 'error page is broken'],
    'empty': ['empty state is missing', 'empty state message is incorrect', 'empty state illustration is broken'],
    'search': ['search is not returning results', 'search results are incorrect', 'search input is not clearing', 'search is too slow'],
    'filter': ['filter is not working', 'filter options are missing', 'filter results are incorrect', 'filter is not resetting'],
    'sort': ['sorting is not working', 'sort order is incorrect', 'sort icon is missing', 'sort is not persisting'],
    'pagination': ['pagination is not working', 'page count is incorrect', 'pagination buttons are missing', 'pagination is not resetting on filter'],
    'upload': ['file upload is not working', 'upload progress is not showing', 'upload size limit is not enforced', 'uploaded file is not displaying'],
    'download': ['download is not working', 'download file is corrupted', 'download progress is not showing', 'download link is broken'],
    'login': ['login is not working', 'login error message is incorrect', 'login redirect is broken', 'login form is not validating'],
    'logout': ['logout is not working', 'logout does not clear session', 'logout redirect is incorrect'],
    'password': ['password reset is not working', 'password validation is incorrect', 'password field is not masking', 'password strength indicator is missing'],
    'profile': ['profile image is not updating', 'profile data is not saving', 'profile page is not loading', 'profile fields are missing'],
    'dashboard': ['dashboard data is not loading', 'dashboard charts are broken', 'dashboard is not refreshing', 'dashboard layout is broken'],
    'api': ['API is returning incorrect data', 'API call is failing', 'API response is slow', 'API error is not handled'],
    'performance': ['page is loading slowly', 'performance is degraded', 'memory usage is high', 'CPU usage is high'],
    'mobile': ['not working on mobile', 'layout is broken on mobile', 'touch events are not working', 'mobile menu is not opening'],
    'responsive': ['not responsive on small screens', 'responsive breakpoints are incorrect', 'content is overflowing on mobile'],
    'accessibility': ['accessibility is not working', 'screen reader is not reading', 'keyboard navigation is broken', 'focus indicator is missing'],
    'crash': ['app is crashing', 'page is crashing on load', 'crash occurs when clicking', 'crash on form submission'],
    'data': ['data is not saving', 'data is incorrect', 'data is not loading', 'data is being lost', 'data is duplicated'],
    'link': ['link is broken', 'link is redirecting incorrectly', 'link is not opening in new tab', 'link color is incorrect'],
    'video': ['video is not playing', 'video controls are missing', 'video is not loading', 'video quality is poor'],
    'audio': ['audio is not playing', 'audio controls are missing', 'audio is not loading'],
    'map': ['map is not loading', 'map markers are missing', 'map zoom is not working', 'map is not responsive'],
    'calendar': ['calendar is not showing dates', 'calendar navigation is broken', 'calendar events are missing', 'calendar date picker is not working'],
    'date': ['date format is incorrect', 'date picker is not working', 'date is showing wrong timezone', 'date validation is incorrect'],
    'time': ['time is showing incorrectly', 'timezone is wrong', 'time format is incorrect'],
    'currency': ['currency format is incorrect', 'currency symbol is missing', 'currency conversion is wrong'],
    'number': ['number format is incorrect', 'number validation is not working', 'decimal places are incorrect'],
    'email': ['email is not sending', 'email template is broken', 'email validation is incorrect', 'email link is not working'],
    'sms': ['SMS is not sending', 'SMS content is incorrect', 'SMS link is broken'],
    'payment': ['payment is not processing', 'payment form is broken', 'payment error is not handled', 'payment confirmation is missing'],
    'cart': ['cart is not updating', 'cart total is incorrect', 'cart items are disappearing', 'cart is not persisting'],
    'checkout': ['checkout is not working', 'checkout form is broken', 'checkout redirect is incorrect', 'checkout confirmation is missing'],
    'order': ['order is not placing', 'order status is incorrect', 'order history is not loading', 'order details are missing'],
    'invoice': ['invoice is not generating', 'invoice data is incorrect', 'invoice download is broken', 'invoice email is not sending'],
    'report': ['report is not generating', 'report data is incorrect', 'report export is broken', 'report filters are not working'],
    'export': ['export is not working', 'exported file is corrupted', 'export format is incorrect', 'export is missing data'],
    'import': ['import is not working', 'import is failing', 'import data is incorrect', 'import validation is missing'],
    'sync': ['sync is not working', 'sync is slow', 'sync is causing data loss', 'sync conflict is not handled'],
    'cache': ['cache is not clearing', 'cached data is stale', 'cache is causing incorrect display'],
    'cookie': ['cookie is not being set', 'cookie is expiring too soon', 'cookie consent is not working'],
    'session': ['session is expiring too soon', 'session is not persisting', 'session data is being lost'],
    'token': ['token is expiring', 'token refresh is not working', 'token is invalid'],
    'permission': ['permission is not working', 'access is denied incorrectly', 'permission check is missing'],
    'role': ['role permissions are incorrect', 'role is not being applied', 'role change is not working'],
    'settings': ['settings are not saving', 'settings page is broken', 'settings are not applying', 'settings are resetting'],
    'theme': ['theme is not applying', 'dark mode is not working', 'theme colors are incorrect', 'theme switch is broken'],
    'language': ['language is not changing', 'translation is missing', 'language detection is incorrect', 'RTL layout is broken'],
    'push': ['push notification is not working', 'notification badge is incorrect', 'notification sound is missing'],
    'webhook': ['webhook is not triggering', 'webhook payload is incorrect', 'webhook is failing'],
    'integration': ['integration is not working', 'integration data is incorrect', 'integration is disconnecting'],
    'plugin': ['plugin is not loading', 'plugin is causing errors', 'plugin is not compatible'],
    'extension': ['extension is not working', 'extension is not loading', 'extension is causing conflicts'],
};

// Common bug title starters
const TITLE_STARTERS = [
    'Button', 'Page', 'Form', 'Modal', 'Dropdown', 'Input', 'Image', 'Text', 'Layout',
    'Navigation', 'Header', 'Footer', 'Sidebar', 'Table', 'Chart', 'Card', 'Loading',
    'Error', 'Search', 'Filter', 'Login', 'Dashboard', 'API', 'Mobile', 'Performance',
    'Data', 'Link', 'Video', 'Calendar', 'Payment', 'Cart', 'Settings', 'Theme',
];

const COMMON_VERBS = [
    'is not working', 'is broken', 'is not loading', 'is not showing', 'is not responding',
    'is missing', 'is incorrect', 'is not saving', 'is not updating', 'is not displaying',
    'is not clickable', 'is not visible', 'is not accessible', 'is not rendering',
    'is throwing an error', 'is causing issues', 'is not functioning', 'is not aligned',
];

function getWordSuggestions(text: string, bugType?: string, pageUrl?: string): string[] {
    if (!text || text.trim().length < 2) return [];

    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/);
    const lastWord = words[words.length - 1];
    const suggestions = new Set<string>();

    // Find matching patterns based on words in the text
    for (const [keyword, completions] of Object.entries(BUG_PATTERNS)) {
        if (lower.includes(keyword)) {
            completions.forEach(c => {
                // Only suggest completions that extend the current text
                if (c.toLowerCase().startsWith(lower) || c.toLowerCase().includes(lower.split(' ').slice(-2).join(' '))) {
                    suggestions.add(c);
                }
            });
        }
    }

    // Suggest based on last word
    for (const [keyword, completions] of Object.entries(BUG_PATTERNS)) {
        if (keyword.startsWith(lastWord) || lastWord.startsWith(keyword)) {
            completions.slice(0, 3).forEach(c => suggestions.add(c));
        }
    }

    // If text ends with a noun, suggest verb completions
    const endsWithNoun = TITLE_STARTERS.some(s => lower.endsWith(s.toLowerCase()));
    if (endsWithNoun) {
        COMMON_VERBS.slice(0, 4).forEach(v => suggestions.add(`${text.trim()} ${v}`));
    }

    // Add page-context suggestions if URL is provided
    if (pageUrl) {
        try {
            const url = new URL(pageUrl);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const pageName = pathParts[pathParts.length - 1] || 'home';
            if (pageName && lower.includes(pageName.toLowerCase())) {
                suggestions.add(`${pageName} page is not loading`);
                suggestions.add(`${pageName} page layout is broken`);
                suggestions.add(`${pageName} page data is incorrect`);
            }
        } catch {}
    }

    // Filter: must start with or contain the current text, and be longer than current text
    const filtered = Array.from(suggestions)
        .filter(s => {
            const sl = s.toLowerCase();
            return sl !== lower && sl.length > lower.length && (
                sl.startsWith(lower) ||
                sl.includes(lower) ||
                lower.split(' ').every(w => w.length < 3 || sl.includes(w))
            );
        })
        .sort((a, b) => {
            // Prefer suggestions that start with the current text
            const aStarts = a.toLowerCase().startsWith(lower) ? 0 : 1;
            const bStarts = b.toLowerCase().startsWith(lower) ? 0 : 1;
            return aStarts - bStarts || a.length - b.length;
        })
        .slice(0, 5);

    return filtered;
}

function getNextWordSuggestions(text: string): string[] {
    if (!text || text.trim().length < 3) return [];

    const lower = text.toLowerCase().trim();
    const nextWords = new Set<string>();

    // Find completions that start with the current text and extract the next word
    for (const completions of Object.values(BUG_PATTERNS)) {
        for (const completion of completions) {
            const cl = completion.toLowerCase();
            if (cl.startsWith(lower) && cl.length > lower.length) {
                const rest = cl.slice(lower.length).trim();
                const nextWord = rest.split(' ')[0];
                if (nextWord && nextWord.length > 1) {
                    nextWords.add(nextWord);
                }
            }
        }
    }

    return Array.from(nextWords).slice(0, 4);
}

export async function POST(request: NextRequest) {
    try {
        const { text, bugType, pageUrl, mode = 'full' } = await request.json();

        if (!text || text.trim().length < 2) {
            return NextResponse.json({ suggestions: [], nextWords: [] });
        }

        if (mode === 'nextword') {
            const nextWords = getNextWordSuggestions(text);
            return NextResponse.json({ suggestions: [], nextWords });
        }

        const suggestions = getWordSuggestions(text, bugType, pageUrl);
        const nextWords = getNextWordSuggestions(text);

        return NextResponse.json({ suggestions, nextWords });
    } catch (error) {
        console.error('Autosuggest error:', error);
        return NextResponse.json({ suggestions: [], nextWords: [] }, { status: 500 });
    }
}
