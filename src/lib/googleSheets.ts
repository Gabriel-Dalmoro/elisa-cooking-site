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
    promoType: 'percentage' | 'bonus_qty'; // NEW: type of promo
    promoBuyQty: number; // NEW: tier meals count the bonus applies to (e.g. 3)
    promoGetQty: number; // NEW: what they actually receive (e.g. 4)
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
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Fetch from 'Promo' sheet. Row 1: Headers, Row 2: Data
        // Columns: B: Active, C: Discount %, D: Label, E: Expiry, F: Type (percentage|bonus_qty), G: Buy Qty, H: Get Qty
        console.log('[GoogleSheets] Fetching Promo Config from range Promo!A1:H50...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Promo!A1:H50',
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
                promoType: 'percentage',
                promoBuyQty: 0,
                promoGetQty: 0,
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
                promoType: 'percentage',
                promoBuyQty: 0,
                promoGetQty: 0,
            };
        }

        // Data starts at index 1 (Column B)
        const active = dataRow[1];
        const discount = dataRow[2];
        const label = dataRow[3];
        const expiryStr = dataRow[4];
        const promoTypeRaw = dataRow[5]?.toLowerCase()?.trim() || 'percentage';
        const promoType = (promoTypeRaw === 'bonus_qty' ? 'bonus_qty' : 'percentage') as 'percentage' | 'bonus_qty';
        const promoBuyQty = parseInt(dataRow[6] || '0') || 0;
        const promoGetQty = parseInt(dataRow[7] || '0') || 0;

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
        const now = new Date();
        const isExpired = expiryDate ? expiryDate < now : false;
        // Parse discount safely to handle both '15' and '15%'
        const rawDiscount = String(discount || '0').replace('%', '').trim();
        const discountValue = parseFloat(rawDiscount) || 0;

        // Strict Promo Validation:
        // 1. Must be set to TRUE in sheet
        // 2. Must have a valid offer (discount > 0 for percentage, or buyQty/getQty for bonus_qty)
        // 3. Must NOT be expired (if expiry date exists)
        const hasValidOffer = promoType === 'bonus_qty'
            ? (promoBuyQty > 0 && promoGetQty > promoBuyQty)
            : discountValue > 0;
        const isActive = (active?.toUpperCase() === 'TRUE') && hasValidOffer && !isExpired;

        const config = {
            promoActive: isActive,
            promoDiscount: discountValue,
            promoLabel: label || '',
            promoExpiry: expiryDate ? expiryDate.toISOString() : '',
            promoType,
            promoBuyQty,
            promoGetQty,
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
            promoType: 'percentage' as const,
            promoBuyQty: 0,
            promoGetQty: 0,
        };
    }
}


// --- Testimonials System ---

export interface Testimonial {
    id: string; // Row index or unique ID if available
    date: string;
    name: string;
    rating: number;
    message: string;
    status: 'Approved' | 'Pending' | 'Flagged';
}

export async function getTestimonials(): Promise<Testimonial[]> {
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

        // Fetch from 'Testimonials' sheet. Columns: A:Date, B:Name, C:Rating, D:Message, E:Status
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Testimonials!A2:E100', // Skip header row
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        // Map and allow only 'Approved' status
        const testimonials: Testimonial[] = rows
            .map((row, index) => ({
                id: `row-${index + 2}`,
                date: row[0],
                name: row[1],
                rating: parseInt(row[2]) || 5,
                message: row[3],
                status: row[4] as Testimonial['status'],
            }))
            .filter(t => t.status === 'Approved' && t.message && t.name);

        return testimonials;
    } catch (error) {
        console.error('Error fetching Testimonials:', error);
        return [];
    }
}

export async function saveTestimonial(data: { name: string; rating: number; message: string }): Promise<boolean> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                    .replace(/^["']|["']$/g, "")
                    .replace(/\\n/g, "\n"),
            },
            // Need full access to append
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Append new row: [Date, Name, Rating, Message, Status]
        // Default status is 'Pending' for moderation
        const date = new Date().toISOString();
        const values = [
            [date, data.name, data.rating, data.message, 'Pending']
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Testimonials!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        return true;
    } catch (error) {
        console.error('Error saving Testimonial:', error);
        return false;
    }
}

// --- Gift Card System ---

export interface GiftCard {
    code: string;
    packageType: string; // e.g. 'three', 'five', 'six', 'custom'
    giver: string;
    recipient: string;
    expiryDate: string; // ISO string
    status: 'Active' | 'Redeemed' | 'Expired';
    recipes: number;
    people: number;
    includeGroceries?: boolean;
    groceriesAmount?: number;
}

export async function getGiftCard(code: string): Promise<GiftCard | null> {
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

        // Fetch from 'GiftCards' sheet. Columns: A:Code, B:PackageType, C:Giver, D:Recipient, E:ExpiryDate, F:Status, G:Recipes, H:People, I:IncludeGroceries, J:GroceriesAmount
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'GiftCards!A2:J500', // Skip header row
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return null;

        const row = rows.find(r => r[0]?.toUpperCase() === code.toUpperCase().trim());
        if (!row) return null;

        const expiryDateStr = row[4];
        const expiryDate = new Date(expiryDateStr);
        const now = new Date();
        const isExpired = isNaN(expiryDate.getTime()) ? false : expiryDate < now;

        return {
            code: row[0],
            packageType: row[1] || 'custom',
            giver: row[2] || '',
            recipient: row[3] || '',
            expiryDate: expiryDateStr || '',
            status: isExpired ? 'Expired' : (row[5] || 'Active') as GiftCard['status'],
            recipes: parseInt(row[6]) || 4,
            people: parseInt(row[7]) || 4,
            includeGroceries: row[8]?.toUpperCase() === 'TRUE',
            groceriesAmount: parseFloat(row[9]) || 0,
        };
    } catch (error) {
        console.error('Error fetching Gift Card:', error);
        return null;
    }
}

export async function redeemGiftCard(code: string): Promise<boolean> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                    .replace(/^["']|["']$/g, "")
                    .replace(/\\n/g, "\n"),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Fetch to locate the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'GiftCards!A1:A500',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return false;

        const rowIndex = rows.findIndex(r => r[0]?.toUpperCase() === code.toUpperCase().trim()) + 1;
        if (rowIndex <= 0) return false;

        // Update column F (index 5) of this row to 'Redeemed'
        // Range: GiftCards!F{rowIndex}
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `GiftCards!F${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['Redeemed']],
            },
        });

        return true;
    } catch (error) {
        console.error('Error redeeming Gift Card:', error);
        return false;
    }
}

export async function createGiftCard(data: {
    code: string;
    packageType: string;
    giver: string;
    recipient: string;
    expiryDate: string;
    recipes: number;
    people: number;
    includeGroceries: boolean;
    groceriesAmount: number;
}): Promise<boolean> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY || '')
                    .replace(/^["']|["']$/g, "")
                    .replace(/\\n/g, "\n"),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Append row: [Code, PackageType, Giver, Recipient, ExpiryDate, Status, Recipes, People, IncludeGroceries, GroceriesAmount]
        const values = [
            [
                data.code.toUpperCase(),
                data.packageType,
                data.giver,
                data.recipient,
                data.expiryDate,
                'Active',
                data.recipes.toString(),
                data.people.toString(),
                data.includeGroceries ? 'TRUE' : 'FALSE',
                data.groceriesAmount.toString()
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'GiftCards!A:J',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        return true;
    } catch (error) {
        console.error('Error saving new Gift Card:', error);
        return false;
    }
}



