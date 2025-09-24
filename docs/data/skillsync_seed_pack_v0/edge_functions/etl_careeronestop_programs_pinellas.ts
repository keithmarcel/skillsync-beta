// supabase/functions/etl_careeronestop_programs_pinellas/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// ENV: COS_USERID, COS_TOKEN
// Docs: https://www.careeronestop.org/Developers/WebAPI/web-services.aspx
export const handler = async (_req: Request) => {
  // TODO: call Training Finder API scoped to Pinellas/Tampa-St. Pete-Clearwater MSA
  // TODO: normalize to schools, programs; attach CIP if present
  // TODO: upsert into schools, programs
  return new Response(JSON.stringify({ok:true, region:'Pinellas', rowsUpserted:0}), {headers:{'content-type':'application/json'}});
}
export default handler;
