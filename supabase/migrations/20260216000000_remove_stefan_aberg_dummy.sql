-- Remove Stefan Åberg dummy data from contacts
-- CASCADE on contact_customer_links and teacher_school_assignments
-- will automatically clean up related rows
DELETE FROM public.contacts
WHERE first_name = 'Stefan' AND last_name = 'Åberg';
