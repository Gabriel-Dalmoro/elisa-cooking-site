import { google } from 'googleapis';

export interface Recipe {
    name: string;
    type: 'Meats' | 'Fish' | 'Vegetarian' | 'Vegan' | string;
}

export interface WeeklyMenu {
    active: boolean;
    weekLabel: string;
    recipes: Recipe[];
}

export interface SiteConfig {
    promoDiscount: number; // 0 to 100
    promoLabel: string;
    promoExpiry: string; // ISO string or Date string
    promoActive: boolean;
}


export async function getWeeklyMenu(): Promise<WeeklyMenu | null> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                // Clean the private key: remove quotes, handle escaped newlines
                private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                    .replace(/^["']|["']$/g, "") // Remove surrounding quotes
                    .replace(/\\n/g, "\n"),      // Fix escaped newlines
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // 1. Get spreadsheet metadata to find the sheet name for gid 1050640086
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        const menuSheet = spreadsheet.data.sheets?.find(
            (sheet) => sheet.properties?.sheetId === 1050640086
        );

        const sheetName = menuSheet?.properties?.title || 'Sheet1';

        // 2. Fetch the data from that sheet (A to R covers 2 header cols + 8 pairs of recipe/type)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:R`,
        });

        const rows = response.data.values;

        if (!rows || rows.length < 2) {
            return null;
        }

        // 3. Find the active row (skip header)
        const activeRow = rows.slice(1).find((row) => row[0]?.toUpperCase() === 'TRUE');

        if (!activeRow) {
            return null;
        }

        // 4. Parse 8 recipes (A=0, B=1, Recipe1=2, Type1=3, Recipe2=4, Type2=5, ...)
        const recipes: Recipe[] = [];
        for (let i = 0; i < 8; i++) {
            const nameIndex = 2 + (i * 2);
            const typeIndex = 3 + (i * 2);

            if (activeRow[nameIndex]) {
                recipes.push({
                    name: activeRow[nameIndex],
                    type: activeRow[typeIndex] || 'Vegetarian' // Default to Veg if missing
                });
            }
        }

        return {
            active: true,
            weekLabel: activeRow[1] || 'Menu de la semaine',
            recipes,
        };
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error);
        return null;
    }
}

export async function getSiteConfig(): Promise<SiteConfig | null> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                    .replace(/^["']|["']$/g, "")
                    .replace(/\\n/g, "\n"),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Fetch from 'Promo' sheet. Row 1: Headers, Row 2: Data
        // Columns: A: Active (TRUE/FALSE), B: Discount %, C: Label, D: Expiry Date
        console.log('[GoogleSheets] Fetching Promo Config from range Promo!A1:F50...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Promo!A1:F50',
        });

        const rows = response.data.values;
        console.log(`[GoogleSheets] Received ${rows?.length || 0} rows.`);

        if (!rows || rows.length === 0) {
            console.warn('[GoogleSheets] No rows returned from Sheet.');
            return {
                promoActive: false,
                promoDiscount: 0,
                promoLabel: '',
                promoExpiry: '',
            };
        }

        // Find the row that starts with 'TRUE' or 'FALSE' in COLUMN B (index 1)
        const dataRow = rows.find((row, idx) => {
            const isActiveCol = row[1]?.toUpperCase();
            const found = isActiveCol === 'TRUE' || isActiveCol === 'FALSE';
            if (found) console.log(`[GoogleSheets] Found data row at index ${idx}:`, row);
            return found;
        });

        if (!dataRow) {
            console.warn('[GoogleSheets] Could not find a row with TRUE/FALSE in Column B.');
            return {
                promoActive: false,
                promoDiscount: 0,
                promoLabel: '',
                promoExpiry: '',
            };
        }

        // Data starts at index 1 (Column B)
        const active = dataRow[1];
        const discount = dataRow[2];
        const label = dataRow[3];
        const expiryStr = dataRow[4];

        // Robust date parsing (handles DD/MM/YY, DD/MM/YYYY etc)
        const parseDate = (str: string) => {
            if (!str) return null;
            const parts = str.split(/[\/\s,:]+/);
            if (parts.length >= 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                const hours = parseInt(parts[3]) || 23;
                const minutes = parseInt(parts[4]) || 59;
                return new Date(year, month, day, hours, minutes);
            }
            const fallback = new Date(str);
            return isNaN(fallback.getTime()) ? null : fallback;
        };

        const expiryDate = parseDate(expiryStr);

        const config = {
            promoActive: active?.toUpperCase() === 'TRUE',
            promoDiscount: parseFloat(discount) || 0,
            promoLabel: label || '',
            promoExpiry: expiryDate ? expiryDate.toISOString() : '',
        };

        console.log('[GoogleSheets] Final Parsed Config:', config);
        return config;
    } catch (error) {
        console.error('[GoogleSheets] Error fetching Site Config:', error);
        return {
            promoActive: false,
            promoDiscount: 0,
            promoLabel: '',
            promoExpiry: '',
        };
    }
}


