// supabase/functions/etl_onet_soc_skills/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// Deno Deploy-style Edge Function
// ENV: ONET_API_KEY
// TODO: Replace endpoints with official O*NET Web Services; map to your needs.
export const handler = async (req: Request) => {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry') === '1';

  // Example: fetch O*NET occupations & skills (pseudo)
  // const res = await fetch(`https://services.onetcenter.org/ws/...`, {
  //   headers: { Authorization: `Basic ${btoa('apiuser:' + Deno.env.get('ONET_API_KEY'))}` }
  // });

  // TODO: Transform -> upsert into tables: skills, jobs (occupation flavor), job_skills
  // Use Supabase client with service role for upserts.

  return new Response(JSON.stringify({ok:true, dryRun}), {headers:{'content-type':'application/json'}});
}
export default handler;
