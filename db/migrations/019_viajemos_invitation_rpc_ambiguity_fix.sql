create or replace function public.get_trip_invitation_preview(invitation_token text)
returns table (
  invitation_id uuid,
  invitation_trip_id uuid,
  trip_title text,
  trip_destination text,
  trip_cover_image text,
  trip_start_date date,
  trip_end_date date,
  invitation_email text,
  invitation_status text,
  invitation_invited_by uuid,
  invitation_invited_by_name text,
  invitation_share_url text,
  viewer_email text,
  viewer_matches_email boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_email text;
begin
  if auth.uid() is not null then
    select users.email
    into current_email
    from auth.users as users
    where users.id = auth.uid();
  end if;

  return query
  select
    invitations.id as invitation_id,
    invitations.trip_id as invitation_trip_id,
    trips.title as trip_title,
    trips.destination as trip_destination,
    trips.cover_image as trip_cover_image,
    trips.start_date as trip_start_date,
    trips.end_date as trip_end_date,
    invitations.email as invitation_email,
    invitations.status as invitation_status,
    invitations.invited_by as invitation_invited_by,
    coalesce(profiles.display_name, split_part(inviter.email, '@', 1), 'Admin del viaje') as invitation_invited_by_name,
    invitations.share_url as invitation_share_url,
    current_email as viewer_email,
    case
      when current_email is null then false
      else lower(current_email) = lower(invitations.email)
    end as viewer_matches_email
  from public.trip_invitations as invitations
  join public.trips on trips.id = invitations.trip_id
  left join public.profiles on profiles.user_id = invitations.invited_by
  left join auth.users as inviter on inviter.id = invitations.invited_by
  where invitations.token = invitation_token;
end;
$$;

create or replace function public.accept_trip_invitation(invitation_token text)
returns table (
  result_trip_id uuid,
  result_member_id uuid,
  result_role text,
  result_status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
  current_user_email text;
  invitation_row public.trip_invitations%rowtype;
  member_row public.trip_members%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select invitations.*
  into invitation_row
  from public.trip_invitations as invitations
  where invitations.token = invitation_token
  limit 1
  for update;

  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  if invitation_row.status <> 'pending' then
    raise exception 'INVITATION_NOT_AVAILABLE';
  end if;

  select users.email
  into current_user_email
  from auth.users as users
  where users.id = current_user_id;

  if current_user_email is null then
    raise exception 'USER_EMAIL_NOT_FOUND';
  end if;

  if lower(current_user_email) <> lower(invitation_row.email) then
    raise exception 'INVITATION_EMAIL_MISMATCH';
  end if;

  insert into public.trip_members (trip_id, user_id, role, status)
  values (invitation_row.trip_id, current_user_id, 'member', 'active')
  on conflict (trip_id, user_id)
  do update
  set
    role = case when public.trip_members.role = 'admin' then 'admin' else 'member' end,
    status = 'active',
    updated_at = now()
  returning *
  into member_row;

  update public.trip_invitations
  set
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  where id = invitation_row.id;

  return query
  select
    member_row.trip_id as result_trip_id,
    member_row.id as result_member_id,
    member_row.role as result_role,
    member_row.status as result_status;
end;
$$;
