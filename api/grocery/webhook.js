// Grocery List Webhook - SMS/Email Integration
// Handles incoming SMS or email messages to add items to grocery list

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { source, message, from, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse the message to extract items
        const items = parseGroceryMessage(message);

        if (items.length === 0) {
            return res.status(400).json({
                error: 'No items found in message',
                message: 'Format: "Grocery list: milk, bread, eggs"'
            });
        }

        // Get or create current list for user
        let currentList;

        if (userId) {
            // Get user's current active list
            const { data: lists, error: listError } = await supabase
                .from('grocery_lists')
                .select('*')
                .eq('user_id', userId)
                .eq('is_archived', false)
                .order('created_at', { ascending: false })
                .limit(1);

            if (listError) throw listError;

            if (lists && lists.length > 0) {
                currentList = lists[0];
            } else {
                // Create new list
                const { data: newList, error: createError } = await supabase
                    .from('grocery_lists')
                    .insert([{
                        user_id: userId,
                        name: `List - ${new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}`,
                        is_archived: false
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                currentList = newList;
            }

            // Add items to list
            const itemsToInsert = items.map(item => ({
                list_id: currentList.id,
                name: item.name,
                quantity: item.quantity,
                category: item.category,
                added_by: userId
            }));

            const { data: insertedItems, error: insertError } = await supabase
                .from('grocery_items')
                .insert(itemsToInsert)
                .select();

            if (insertError) throw insertError;

            // Log the integration event
            await supabase
                .from('integration_log')
                .insert([{
                    user_id: userId,
                    source: source || 'unknown',
                    raw_message: message,
                    items_added: insertedItems
                }]);

            return res.status(200).json({
                success: true,
                itemsAdded: insertedItems.length,
                items: insertedItems,
                listName: currentList.name
            });

        } else {
            // No userId provided - return parsed items for client-side handling
            return res.status(200).json({
                success: true,
                items: items,
                message: 'Items parsed successfully. Add userId to save to database.'
            });
        }

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            error: 'Failed to process message',
            details: error.message
        });
    }
}

// Parse grocery list message
function parseGroceryMessage(message) {
    // Look for "Grocery list:" prefix (case-insensitive)
    const prefixRegex = /grocery\s+list\s*:?\s*/i;

    // Extract the part after "Grocery list:"
    let itemsText = message;
    if (prefixRegex.test(message)) {
        itemsText = message.replace(prefixRegex, '');
    }

    // Split by common delimiters (comma, newline, semicolon)
    const rawItems = itemsText
        .split(/[,;\n]+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

    // Parse each item to extract quantity and name
    const items = rawItems.map(rawItem => {
        const item = parseItem(rawItem);
        return item;
    });

    return items;
}

// Parse individual item to extract quantity and category hints
function parseItem(text) {
    // Common quantity patterns: "2 milk", "1 lb beef", "3 cans soup"
    const quantityMatch = text.match(/^(\d+\s*(?:lb|oz|kg|g|lbs|can|cans|bottle|bottles|jar|jars|box|boxes|bag|bags)?)\s+(.+)$/i);

    if (quantityMatch) {
        return {
            name: capitalizeFirst(quantityMatch[2].trim()),
            quantity: quantityMatch[1].trim(),
            category: guessCategory(quantityMatch[2].trim())
        };
    }

    return {
        name: capitalizeFirst(text.trim()),
        quantity: null,
        category: guessCategory(text.trim())
    };
}

// Guess category based on item name
function guessCategory(itemName) {
    const name = itemName.toLowerCase();

    // Produce
    if (/apple|banana|orange|grape|berry|lettuce|tomato|potato|onion|carrot|celery|spinach|kale|broccoli|cucumber|pepper|fruit|vegetable/.test(name)) {
        return 'produce';
    }

    // Dairy
    if (/milk|cheese|yogurt|butter|cream|egg/.test(name)) {
        return 'dairy';
    }

    // Meat
    if (/chicken|beef|pork|fish|turkey|lamb|meat|steak|bacon|sausage/.test(name)) {
        return 'meat';
    }

    // Bakery
    if (/bread|bun|roll|bagel|croissant|muffin|donut|cake|cookie|pastry/.test(name)) {
        return 'bakery';
    }

    // Pantry
    if (/rice|pasta|bean|soup|sauce|oil|vinegar|spice|flour|sugar|salt|pepper|cereal|oat/.test(name)) {
        return 'pantry';
    }

    // Frozen
    if (/frozen|ice cream|popsicle/.test(name)) {
        return 'frozen';
    }

    // Beverages
    if (/water|juice|soda|coffee|tea|beer|wine|drink/.test(name)) {
        return 'beverages';
    }

    // Snacks
    if (/chip|cracker|nut|candy|chocolate|popcorn|pretzel|snack/.test(name)) {
        return 'snacks';
    }

    // Household
    if (/soap|shampoo|detergent|cleaner|paper|towel|tissue|toilet|trash/.test(name)) {
        return 'household';
    }

    return 'other';
}

// Capitalize first letter
function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================================================================
// WEBHOOK INTEGRATIONS
// ============================================================================

// Twilio SMS Webhook Handler
export async function handleTwilioSMS(req, res) {
    // Twilio sends SMS data as form-encoded
    const { From, Body } = req.body;

    // You would need to map phone numbers to user IDs
    // This is a placeholder - in production, maintain a mapping table
    const userId = await getUserIdFromPhone(From);

    return handler({
        ...req,
        body: {
            source: 'sms',
            message: Body,
            from: From,
            userId: userId
        }
    }, res);
}

// SendGrid Email Webhook Handler
export async function handleSendGridEmail(req, res) {
    // SendGrid sends email data in a specific format
    const { from, subject, text } = req.body;

    // Extract email address
    const emailMatch = from?.match(/<(.+)>/);
    const email = emailMatch ? emailMatch[1] : from;

    // Get user ID from email
    const userId = await getUserIdFromEmail(email);

    // Use email subject or body
    const message = subject?.toLowerCase().includes('grocery') ? text : `${subject}\n${text}`;

    return handler({
        ...req,
        body: {
            source: 'email',
            message: message,
            from: email,
            userId: userId
        }
    }, res);
}

// Helper functions to map phone/email to user ID
async function getUserIdFromPhone(phone) {
    // TODO: Implement phone number to user ID mapping
    // This would require a user_contacts table in Supabase
    return null;
}

async function getUserIdFromEmail(email) {
    // TODO: Look up user by email in Supabase auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .single();

        if (error || !data) return null;
        return data.user_id;
    } catch (err) {
        console.error('Error looking up user:', err);
        return null;
    }
}
