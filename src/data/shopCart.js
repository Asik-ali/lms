export function ownsPlan(plan, user) {
  const names = value => new Set(String(value || '').split(',').map(name => name.trim().toLowerCase()).filter(Boolean));
  const courses = names(user?.course);
  const series = names(user?.test_series_access);
  return Boolean(plan.items?.length) && plan.items.every(item =>
    (item.item_type === 'course' ? courses : series).has(String(item.label || '').trim().toLowerCase()));
}

export function cartSelection(plans, ids, user) {
  const selected = new Set(ids.map(String));
  return plans.filter(plan => selected.has(String(plan.id)) && !ownsPlan(plan, user) && Number(plan.price) > 0 && plan.items?.length);
}

export function cartTotal(plans) {
  return plans.reduce((total, plan) => total + Math.round(Number(plan.price) * 100), 0) / 100;
}
