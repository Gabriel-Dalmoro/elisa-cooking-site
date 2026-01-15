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

export async function getWeeklyMenu(): Promise<WeeklyMenu | null> {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
