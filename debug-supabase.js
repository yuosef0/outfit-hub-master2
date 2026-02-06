
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wxouswgrlurjddfacplu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4b3Vzd2dybHVyamRkZmFjcGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTYxOTEsImV4cCI6MjA4NTY3MjE5MX0.DUU3V4dBPO29XcRS3wyu3AIFp9rnKb6kL3r8sIVx6pE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    console.log("Testing Supabase connection...");

    // Test 1: Fetch 1 product
    console.log("\n--- Fetching 1 product ---");
    const { data: products, error: prodError } = await supabase.from('products').select('*').limit(1);
    if (prodError) console.error("Error fetching products:", prodError);
    else console.log("Product:", products ? products[0] : "None");

    // Test 2: Fetch 1 cart item
    console.log("\n--- Fetching 1 cart item ---");
    const { data: cartItems, error: cartError } = await supabase.from('cart_items').select('*').limit(1);
    if (cartError) console.error("Error fetching cart_items:", cartError);
    else console.log("Cart Item:", cartItems ? cartItems[0] : "None");

    // Test 3: Join cart -> product
    console.log("\n--- Fetching cart joined with product ---");
    const { data: joined, error: joinError } = await supabase.from('cart_items').select('*, products:product_id(*)').limit(1);
    if (joinError) console.error("Error join product:", joinError);
    else console.log("Joined:", joined ? JSON.stringify(joined[0], null, 2) : "None");

    // Test 4: Deep join cart -> product -> store
    console.log("\n--- Fetching deep join ---");
    const { data: deep, error: deepError } = await supabase.from('cart_items')
        .select(`
        *,
        products:product_id (
            *,
            stores:store_id (*)
        )
    `).limit(1);
    if (deepError) console.error("Error deep join:", deepError);
    else console.log("Deep Joined:", deep ? JSON.stringify(deep[0], null, 2) : "None");

}

test();
