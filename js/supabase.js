import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let uid = null;

// Recupera la sesión guardada (si existe) y restaura el uid
export async function sesionActiva() {
  const { data } = await sb.auth.getSession();
  uid = data.session?.user.id ?? null;
  return !!uid;
}

export async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (!error) uid = data.user.id;
  return { error };
}

export async function logout() {
  await sb.auth.signOut();
  uid = null;
}

export async function cargarDatos() {
  const [p, c] = await Promise.all([
    sb.from("progreso_caso").select("oll_num, peso"),
    sb.from("perfil").select("color_arriba").maybeSingle(),
  ]);
  if (p.error) throw p.error;
  const pesos = {};
  p.data.forEach(r => { pesos[r.oll_num] = r.peso; });
  return { pesos, color: c.data?.color_arriba };
}

export const guardarPeso = (num, peso) =>
  sb.from("progreso_caso").upsert(
    { usuario_id: uid, oll_num: num, peso, actualizado: new Date().toISOString() },
    { onConflict: "usuario_id,oll_num" }
  );

export const guardarColor = color =>
  sb.from("perfil").upsert({ usuario_id: uid, color_arriba: color });