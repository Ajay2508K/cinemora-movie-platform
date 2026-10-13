import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers={ "Access-Control-Allow-Origin":Deno.env.get("SITE_ORIGIN")??"https://YOUR-SITE-DOMAIN.example","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store" };
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{...headers,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const origin=req.headers.get("origin"),site=Deno.env.get("SITE_ORIGIN");if(!site)return json({error:"SITE_ORIGIN is not configured"},500);if(origin!==site)return json({error:"Origin not allowed"},403);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return json({error:"Server is not configured"},500);
 let b:{movieId?:string};try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
 if(!b.movieId||!/^[0-9a-f-]{36}$/i.test(b.movieId))return json({error:"Invalid title ID"},400);
 const db=createClient(url,key,{auth:{persistSession:false}}),{data:m,error}=await db.from("movies").select("video_path,published").eq("id",b.movieId).maybeSingle();
 if(error||!m||!m.published)return json({error:"Title not found"},404);
 const {data:signed,error:signError}=await db.storage.from("cinemora-media").createSignedUrl(m.video_path,300,{download:false});
 if(signError||!signed?.signedUrl)return json({error:"Unable to create playback URL"},500);
 return json({url:signed.signedUrl,expiresIn:300});
});
