import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers={ "Access-Control-Allow-Origin":Deno.env.get("SITE_ORIGIN")??"https://YOUR-SITE-DOMAIN.example","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store" };
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{...headers,"Content-Type":"application/json"}});
const fromB64url=(s:string)=>{const raw=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(raw+"=".repeat((4-raw.length%4)%4)),c=>c.charCodeAt(0));};
async function validHumanToken(token:string,site:string,secret:string){
 try{
  const parts=token.split(".");if(parts.length!==2)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  if(!await crypto.subtle.verify("HMAC",key,fromB64url(parts[1]),new TextEncoder().encode(parts[0])))return false;
  const claims=JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
  return claims.host===new URL(site).hostname&&Number(claims.exp)>Date.now();
 }catch{return false;}
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const origin=req.headers.get("origin"),site=Deno.env.get("SITE_ORIGIN");if(!site||origin!==site)return json({error:"Origin not allowed"},403);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),captchaSecret=Deno.env.get("CAPTCHA_SESSION_SECRET");
 if(!url||!key||!captchaSecret)return json({error:"Server is not configured"},500);
 let b:{movieId?:string;humanToken?:string};try{b=await req.json()}catch{return json({error:"Invalid JSON"},400)}
 if(!b.movieId||!/^[0-9a-f-]{36}$/i.test(b.movieId))return json({error:"Invalid title ID"},400);
 if(!b.humanToken||!await validHumanToken(b.humanToken,site,captchaSecret))return json({error:"Complete human verification first"},403);
 const db=createClient(url,key,{auth:{persistSession:false}}),{data:m,error}=await db.from("movies").select("video_path,published").eq("id",b.movieId).maybeSingle();
 if(error||!m||!m.published)return json({error:"Title not found"},404);
 const {data:signed,error:signError}=await db.storage.from("cinemora-media").createSignedUrl(m.video_path,300,{download:false});
 if(signError||!signed?.signedUrl)return json({error:"Unable to create playback URL"},500);
 return json({url:signed.signedUrl,expiresIn:300});
});
