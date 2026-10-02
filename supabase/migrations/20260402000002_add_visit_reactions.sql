alter table restaurant_visits
  add column if not exists would_go_again boolean,
  add column if not exists worth_the_money boolean;
