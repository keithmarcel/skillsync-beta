// supabase/functions/etl_bls_oews_msa/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// ENV: BLS_API_KEY (optional for some endpoints)
// Pull OEWS wages for the Tampa–St. Petersburg–Clearwater MSA and upsert into jobs (occupation flavor).
export const handler = async (_req: Request) => {
  // TODO: fetch OEWS tables -> map SOC->median wage
  // TODO: upsert into jobs.median_wage_usd where job_kind='occupation'
  return new Response(JSON.stringify({ok:true, area:'Tampa-StPete-Clearwater', rowsUpserted:0}), {headers:{'content-type':'application/json'}});
}
export default handler;
