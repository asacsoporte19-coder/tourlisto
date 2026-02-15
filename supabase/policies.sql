-- Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "itinerary_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "checklist_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "checklist_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Users can read own profile" ON "profiles";
DROP POLICY IF EXISTS "Users can see trips they are part of" ON "trips";
DROP POLICY IF EXISTS "Users can insert trips" ON "trips";
DROP POLICY IF EXISTS "Users can update trips they are part of" ON "trips";
DROP POLICY IF EXISTS "Owners can delete trips" ON "trips";
DROP POLICY IF EXISTS "Members visible to trip members" ON "trip_members";
DROP POLICY IF EXISTS "Users can add members to trips they own" ON "trip_members";
DROP POLICY IF EXISTS "Users can update members in trips they own" ON "trip_members";
DROP POLICY IF EXISTS "Users can remove members from trips they own" ON "trip_members";
DROP POLICY IF EXISTS "Access itinerary items if member" ON "itinerary_items";
DROP POLICY IF EXISTS "Access checklist if member" ON "checklist_categories";
DROP POLICY IF EXISTS "Access checklist items if member" ON "checklist_items";
DROP POLICY IF EXISTS "Access expenses if member" ON "expenses";


-- PROFILES
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "profiles"
FOR SELECT USING (auth.uid() = id);

-- TRIPS
-- Users can see trips they created OR are members of
CREATE POLICY "Users can see trips they are part of" ON "trips"
FOR SELECT USING (
  created_by = auth.uid() OR
  exists (
    select 1 from trip_members 
    where trip_members.trip_id = trips.id 
    and trip_members.user_id = auth.uid()
  )
);

-- Users can insert trips (owner automatically set via trigger or client)
CREATE POLICY "Users can insert trips" ON "trips"
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update trips they own or are members of
CREATE POLICY "Users can update trips they are part of" ON "trips"
FOR UPDATE USING (
  created_by = auth.uid() OR
  exists (
    select 1 from trip_members 
    where trip_members.trip_id = trips.id 
    and trip_members.user_id = auth.uid()
  )
);

-- Users can delete trips only if they are the owner
CREATE POLICY "Owners can delete trips" ON "trips"
FOR DELETE USING (created_by = auth.uid());


-- TRIP MEMBERS
-- Members can be seen by other members of the same trip
CREATE POLICY "Members visible to trip members" ON "trip_members"
FOR SELECT USING (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and (
      trips.created_by = auth.uid() OR
      exists (select 1 from trip_members tm where tm.trip_id = trips.id and tm.user_id = auth.uid())
    )
  )
);

-- Users can add members to trips they created
CREATE POLICY "Users can add members to trips they own" ON "trip_members"
FOR INSERT WITH CHECK (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.created_by = auth.uid()
  )
);

-- Users can update members in trips they created
CREATE POLICY "Users can update members in trips they own" ON "trip_members"
FOR UPDATE USING (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.created_by = auth.uid()
  )
);

-- Users can remove members from trips they created
CREATE POLICY "Users can remove members from trips they own" ON "trip_members"
FOR DELETE USING (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.created_by = auth.uid()
  )
);

-- ITINERARY ITEMS, CHECKLIST, WALLET
-- Policies for child tables (checking trip membership)

CREATE POLICY "Access itinerary items if member" ON "itinerary_items"
FOR ALL USING (
  exists (
    select 1 from trips
    left join trip_members on trips.id = trip_members.trip_id
    where trips.id = itinerary_items.trip_id
    and (trips.created_by = auth.uid() or trip_members.user_id = auth.uid())
  )
);

CREATE POLICY "Access checklist if member" ON "checklist_categories"
FOR ALL USING (
  exists (
    select 1 from trips
    left join trip_members on trips.id = trip_members.trip_id
    where trips.id = checklist_categories.trip_id
    and (trips.created_by = auth.uid() or trip_members.user_id = auth.uid())
  )
);

CREATE POLICY "Access checklist items if member" ON "checklist_items"
FOR ALL USING (
  exists (
    select 1 from trips
    left join trip_members on trips.id = trip_members.trip_id
    where trips.id = checklist_items.trip_id
    and (trips.created_by = auth.uid() or trip_members.user_id = auth.uid())
  )
);

CREATE POLICY "Access expenses if member" ON "expenses"
FOR ALL USING (
  exists (
    select 1 from trips
    left join trip_members on trips.id = trip_members.trip_id
    where trips.id = expenses.trip_id
    and (trips.created_by = auth.uid() or trip_members.user_id = auth.uid())
  )
);
