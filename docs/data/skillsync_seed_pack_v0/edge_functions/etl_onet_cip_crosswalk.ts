// supabase/functions/etl_onet_cip_crosswalk/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// ENV: ONET_API_KEY
// Pull CIP<->SOC crosswalk from O*NET data or static file and upsert into cip_soc_crosswalk.
export const handler = async (_req: Request) => {
  // TODO: fetch crosswalk CSV/JSON
  // TODO: parse and upsert
  return new Response(JSON.stringify({ok:true, rowsUpserted:0}), {headers:{'content-type':'application/json'}});
}
export default handler;
