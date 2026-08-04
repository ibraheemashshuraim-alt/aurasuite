-- WARNING: This will safely delete ALL testing data and resolve Foreign Key Constraint Errors.
-- Run this in your Supabase SQL Editor.

-- 1. Delete presence data (Foreign Key to profiles)
DELETE FROM public.presence;

-- 2. Delete dependent messages first (Foreign Keys to profiles & meetings)
DELETE FROM public.group_messages;
DELETE FROM public.dm_messages;

-- 3. Delete meetings and their states/invites (Foreign Key to profiles)
DELETE FROM public.meeting_states;
DELETE FROM public.meeting_invites;
DELETE FROM public.meetings;

-- 4. Delete tasks (Foreign Key to profiles)
DELETE FROM public.tasks;

-- 5. Delete digital cards and bans
DELETE FROM public.digital_cards;
DELETE FROM public.banned_emails;

-- 6. Finally, safely delete profiles EXCEPT the Super Admin
DELETE FROM public.profiles 
WHERE email != 'ibraheemashshuraim@gmail.com';
