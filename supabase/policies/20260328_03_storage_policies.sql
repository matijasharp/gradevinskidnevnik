create policy "authenticated users can upload photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'diary-photos');

create policy "photos are publicly readable"
on storage.objects for select
using (bucket_id = 'diary-photos');

create policy "authenticated users can delete photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'diary-photos');
