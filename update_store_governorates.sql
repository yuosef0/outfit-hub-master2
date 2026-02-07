DO $$
BEGIN
    -- Update Fashion Hub (Cairo)
    UPDATE stores SET governorate = 'Cairo' WHERE name = 'Fashion Hub';

    -- Update Footwear Emporium (Alexandria)
    UPDATE stores SET governorate = 'Alexandria' WHERE name = 'Footwear Emporium';

    -- Update Accessory Haven (Giza)
    UPDATE stores SET governorate = 'Giza' WHERE name = 'Accessory Haven';

    -- Update Style Studio (Cairo)
    UPDATE stores SET governorate = 'Cairo' WHERE name = 'Style Studio';

    -- Update Urban Threads (Cairo)
    UPDATE stores SET governorate = 'Cairo' WHERE name = 'Urban Threads';

    -- Update Luxury Watches (Cairo)
    UPDATE stores SET governorate = 'Cairo' WHERE name = 'Luxury Watches';

    -- Update Bag Boutique (Giza)
    UPDATE stores SET governorate = 'Giza' WHERE name = 'Bag Boutique';

    -- Update Gem Palace (Cairo)
    UPDATE stores SET governorate = 'Cairo' WHERE name = 'Gem Palace';

    RAISE NOTICE 'Updated governorates for seeded stores.';
END $$;
