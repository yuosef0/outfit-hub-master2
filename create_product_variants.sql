-- Create product_variants table
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  size text,
  color text,
  stock_quantity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, size, color)
);

-- Enable RLS
alter table public.product_variants enable row level security;

-- Policies
create policy "Public variants are viewable by everyone"
  on public.product_variants for select
  using ( true );

create policy "Merchants can insert variants for their own products"
  on public.product_variants for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
      and exists (
        select 1 from public.stores
        where stores.id = products.store_id
        and stores.merchant_id = auth.uid()
      )
    )
  );

create policy "Merchants can update variants for their own products"
  on public.product_variants for update
  using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
      and exists (
        select 1 from public.stores
        where stores.id = products.store_id
        and stores.merchant_id = auth.uid()
      )
    )
  );

create policy "Merchants can delete variants for their own products"
  on public.product_variants for delete
  using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
      and exists (
        select 1 from public.stores
        where stores.id = products.store_id
        and stores.merchant_id = auth.uid()
      )
    )
  );
